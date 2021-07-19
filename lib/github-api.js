const core = require('@actions/core');
const github = require('@actions/github');

module.exports = class GithubApi {

  constructor(token, owner, repository) {
    this.octokit = github.getOctokit(token);
    this.owner = owner;
    this.repository = repository;
  }

  // Get the sha of the head commit of the head branch (= source branch) of the pull request
  async getHeadCommitShaFromPullRequest(branch) {
    try {
      let sourceBranch = await this.octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
        owner: this.owner,
        repo: this.repository,
        branch: branch
      });

      console.log('Head commit sha : ' + sourceBranch.data.commit.sha);
      return sourceBranch.data.commit.sha;

    } catch (error) {
      core.setFailed(error.message);
    }
  }

  // Get all pull requests related to the head branch
  async getPullRequestsForHeadBranch(headRef) {
    try {
      let pullRequestList = await this.octokit.request("GET /repos/{owner}/{repo}/pulls", {
        owner: this.owner,
        repo: this.repository,
        state: 'all',
        head: headRef
      });

      console.log('All pull requests retrieved for the branch ' + headRef);
      return pullRequestList;

    } catch (error) {
      core.setFailed(error.message);
    }
  }

  // Add a review to lock or approve a PR (it is useful only if there is a protection rule on the branch which require at least 1 reviewer)
  async reviewPullRequest(pull_number, commentContent, reviewState) {
    try {
      let reviewResult = await this.octokit.request("POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews", {
        owner: this.owner,
        repo: this.repository,
        pull_number: pull_number,
        event: reviewState,
        body: commentContent
      });

      console.log('Add a review (' + reviewResult.data.state + ') to PR #' + pull_number);
      return reviewResult.data;

    } catch (error) {
      core.setFailed(error.message);
    }
  }

  // Create a PR from headRef to baseRef (branch)
  async createPullRequest(headRef, baseRef) {
    try {
      let newPullRequest = await this.octokit.request("POST /repos/{owner}/{repo}/pulls", {
        owner: this.owner,
        repo: this.repository,
        head: headRef,
        base: baseRef,
        title: 'Merge from ' + headRef + ' to ' + baseRef
      });

      console.log('PR created from ' + headRef + ' to ' + baseRef + ' : ' + newPullRequest.data.html_url);
      return newPullRequest.data.html_url;

    } catch (error) {
      core.setFailed(error.message);
    }
  }
}