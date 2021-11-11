import { Octokit, App } from "octokit";
console.log("hello world")
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });
async function callGithub() {
    const repos = await octokit.paginate('GET /orgs/{org}/repos', {
        org: 'alphagov',
      })
   const pay_repos = repos.filter(repo => repo.topics.includes('govuk-pay'))
   console.log(JSON.stringify(pay_repos))   
      
}

callGithub()