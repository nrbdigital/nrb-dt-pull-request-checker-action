const core = require('@actions/core');
const github = require('@actions/github');
const GithubApi = require('./lib/github-api');

async function run() {
  try { 
    
    const token = core.getInput('github_token') || github.context.token;
    const owner = github.context.payload.repository.owner.login;
    const repository = github.context.payload.repository.name;
    const githubApi = new GithubApi(token, owner, repository);

    const GITHUB_HEAD_REF = core.getInput('head_ref') || 'hotfix/0.6.2';
    const GITHUB_BASE_REF = core.getInput('base_ref') || 'master';
    const DEFAULT_REF = core.getInput('default_ref') || 'develop';

    // Get the head branch (= source branch) of the pull request (to retrieve its head commit)
    const GITHUB_HEAD_SHA = await githubApi.getHeadCommitShaFromPullRequest(GITHUB_HEAD_REF);

    // Get all pull requests related to the head branch
    let pullRequestList = await githubApi.getPullRequestsForHeadBranch(GITHUB_HEAD_REF);

    let sourcePullRequest = null;
    let newPullRequestNeeded = true;
    let shouldLockPullRequest = true;
    let commentContent = '';

    pullRequestList.data.forEach(pullRequest => {

      // Find the opened pull request to block if the GITHUB_HEAD_REF is not merged into DEFAULT_REF
      if (pullRequest.head.ref === GITHUB_HEAD_REF && pullRequest.head.sha === GITHUB_HEAD_SHA && pullRequest.base.ref === GITHUB_BASE_REF && pullRequest.state === 'open') {
        console.log('The source pull request is found : ', pullRequest.html_url);
        sourcePullRequest = pullRequest;
      }

      // Check if a PR from GITHUB_HEAD_REF to DEFAULT_REF already exists and is merged
      if (pullRequest.head.ref === GITHUB_HEAD_REF && pullRequest.head.sha === GITHUB_HEAD_SHA && pullRequest.base.ref === DEFAULT_REF) {
        // Open PR already exists
        if (pullRequest.state === 'open') {
          console.log('A PR already exists and is open : ', pullRequest.html_url);
          commentContent = 'A PR already exists and is open : ' + pullRequest.html_url + '\nPlease merge it to unlock this PR';
          newPullRequestNeeded = false;
        } else {
          // Merged PR exists then a review 'APPROVE' will be added
          if (pullRequest.merged_at !== null) {
            console.log('A PR from from ' + GITHUB_HEAD_REF + ' to ' + DEFAULT_REF + ' is merged, then ok');
            commentContent = 'A PR from from ' + GITHUB_HEAD_REF + ' to ' + DEFAULT_REF + ' is merged (#' + pullRequest.number + ').\nThis PR is allowed to be merged';
            newPullRequestNeeded = false;
            shouldLockPullRequest = false;
          } else {
            // Closed PR exists but it is useless
            console.log('A closed PR is found : ' + pullRequest.number + ', look for another PR');
          }
        }
      }
    });

    // Create a new PR if needed
    if (newPullRequestNeeded) {
      const pullRequestURL = await githubApi.createPullRequest(GITHUB_HEAD_REF, DEFAULT_REF);
      commentContent = 'No opened or merged PR from ' + GITHUB_HEAD_REF + ' to ' + DEFAULT_REF + ' found.\nA new PR is created, please merge it to unlock this PR\nLink : ' + pullRequestURL;
    }

    // Add a review to the PR
    let reviewState = shouldLockPullRequest ? 'REQUEST_CHANGES' : 'APPROVE';
    if(sourcePullRequest) {
      await githubApi.reviewPullRequest(sourcePullRequest.number, commentContent, reviewState);
    } else {
      console.log('No source pull request found. The hotfix was probably first merged in develop before master (and it\'s ok)');
    }
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()