import { Octokit } from "octokit";

const DEPENDENCY_TO_SEARCH = 'rc'
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

console.log("Script takes a while whilst it queries github")

const isObject = (value) => {
    return !!(value && typeof value === "object" && !Array.isArray(value));
};

const findNestedDependencyKey = (object, keyToMatch) => {
    if (isObject(object)) {
        const entries = Object.entries(object);

        for (let i = 0; i < entries.length; i += 1) {
            const [objectKey, objectValue] = entries[i];

            if (objectKey === keyToMatch && typeof (objectValue) != 'string') {
                return object[keyToMatch]['version'];
            }

            if (isObject(objectValue)) {
                const child = findNestedDependencyKey(objectValue, keyToMatch);

                if (child !== null) {
                    return child;
                }
            }
        }
    }

    return null;
};


async function callGithub() {
    const repos = await octokit.paginate('GET /orgs/{org}/repos', {
        org: 'alphagov',
    })
    const pay_repos = repos.filter(repo => repo.topics.includes('govuk-pay')).map(repo => repo['name'])
    const fileListing = await Promise.all(pay_repos.map(repo => octokit.paginate(`GET /repos/alphagov/${repo}/contents`, {
    })))
    const packageLockFiles = fileListing.flat(1).filter(r => r['name'] == 'package-lock.json').map(f => f['url'])
    const paths = packageLockFiles.map(f => f.split("https://api.github.com")[1])
    const files = await Promise.all(paths.map(path => octokit.paginate(`GET ${path}`, {
    })))

    files.flat(1).forEach(item => {
        let buff = Buffer.from(item['content'], 'base64')
        const packageJsonContents = JSON.parse(buff.toString('utf-8'));
        const repoName = item['url'].split('/')[5] + '-package-lock.json'

        const result = findNestedDependencyKey(packageJsonContents, DEPENDENCY_TO_SEARCH)
        if (result != null) {
            console.log(`${repoName} ${DEPENDENCY_TO_SEARCH} version: ${result}`)
        }
    })
}


callGithub()