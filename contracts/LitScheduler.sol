// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LitScheduler {

    struct Job {
        address to;
        uint256 amount;
        uint256 nextRun;
        uint256 interval;
        uint256 maxCycles;
        uint256 executedCycles;
        bool active;
        string label;
    }

    struct ExecutionLog {
        uint256 jobId;
        uint256 timestamp;
        uint256 amount;
        address to;
        bool success;
    }

    mapping(address => Job[]) public jobs;
    mapping(address => ExecutionLog[]) public history;

    event JobCreated(address indexed owner, uint256 jobId, address to, uint256 amount, uint256 interval, uint256 maxCycles);
    event JobExecuted(address indexed owner, uint256 jobId, address to, uint256 amount);
    event JobCancelled(address indexed owner, uint256 jobId);
    event JobCompleted(address indexed owner, uint256 jobId);

    function createJob(
        address _to,
        uint256 _interval,
        uint256 _maxCycles,
        string calldata _label
    ) external payable {
        require(msg.value > 0, "Send zkLTC");
        require(_to != address(0), "Invalid address");
        require(_interval > 0, "Invalid interval");
        require(_maxCycles > 0, "Min 1 cycle");

        uint256 amountPerCycle = msg.value / _maxCycles;
        require(amountPerCycle > 0, "Amount too small");

        jobs[msg.sender].push(Job({
            to: _to,
            amount: amountPerCycle,
            nextRun: block.timestamp + _interval,
            interval: _interval,
            maxCycles: _maxCycles,
            executedCycles: 0,
            active: true,
            label: _label
        }));

        emit JobCreated(msg.sender, jobs[msg.sender].length - 1, _to, amountPerCycle, _interval, _maxCycles);
    }

    function execute(address owner, uint256 jobId) external {
        Job storage job = jobs[owner][jobId];
        require(job.active, "Job inactive");
        require(block.timestamp >= job.nextRun, "Too early");
        require(address(this).balance >= job.amount, "No funds");

        job.executedCycles += 1;
        job.nextRun = block.timestamp + job.interval;

        if (job.executedCycles >= job.maxCycles) {
            job.active = false;
            emit JobCompleted(owner, jobId);
        }

        payable(job.to).transfer(job.amount);

        history[owner].push(ExecutionLog({
            jobId: jobId,
            timestamp: block.timestamp,
            amount: job.amount,
            to: job.to,
            success: true
        }));

        emit JobExecuted(owner, jobId, job.to, job.amount);
    }

    function cancelJob(uint256 jobId) external {
        jobs[msg.sender][jobId].active = false;
        emit JobCancelled(msg.sender, jobId);
    }

    function withdraw() external {
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to withdraw");
        payable(msg.sender).transfer(bal);
    }

    function getJobs(address owner) external view returns (Job[] memory) {
        return jobs[owner];
    }

    function getHistory(address owner) external view returns (ExecutionLog[] memory) {
        return history[owner];
    }

    function getJobCount(address owner) external view returns (uint256) {
        return jobs[owner].length;
    }

    receive() external payable {}
}