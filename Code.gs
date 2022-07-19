/*
 * Google Form - Github Projects V2 Board Integration - V1
 * By: Edwin Mak (https://github.com/edwinthinks)
 *
 * This google script is used to create a draft issue on the Github Projects V2 board using
 * a form response submitted through Google Forms. Created to capture bug reports & support 
 * issues collected via Google Forms and to be used as a way to track them in the Github so
 * that teams do not have to juggle multiple tools to handle support issues.
 *
 * You can find updates or issues here - https://github.com/edwinthinks/google-forms-github-projects-v2
 */



// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
/*
 * START HERE!
 *
 * 1. Define the githubAuthToken with a token that has the permissions to create a draft issue
 * 2. Define the githubProjectId with the id of the github project. You can find this by using 
 * the instructions here - https://docs.github.com/en/enterprise-cloud@latest/issues/trying-out-the-new-projects-experience/using-the-api-to-manage-projects#finding-information-about-projects
 * 3. Customize the buildDraftIssueBody, buildFields, and buildTitle functions below to match 
 * your desired draft issue structure.
 * 4. Update the scripts associated to your Google Forms
 * 5. Run the script via form submit
 * 6. The draft issue will be created on the Github Projects V2 board
/*

/**
 * Generate the body of the draft issue to be created using the form response data.
 * @param {Object} formResponseMap - The form response data.
 * @returns {String} - The body of the draft issue. Markdown is supported!
*/

var githubAuthToken = '';
var githubProjectV2Id = '';


/**
 * Generate the body of the draft issue to be created using the form response data.
 * @param {Object} formResponseMap - The form response data.
 * @returns {String} - The body of the draft issue. Markdown is supported!
 */
function buildDraftIssueBody(formResponseMap) {
    const body = `
# Submitted By
${formResponseMap['What is your name?']} (${formResponseMap['email']})

# Description
${formResponseMap['What is the bug? (in one sentence please)']}

# Priority
${formResponseMap['Priority Level']}

# Reproduction Steps
${formResponseMap['Steps that made the bug happen (include IDs if possible please) (PLEASE INCLUDE PARTNER EMAIL IF APPLICABLE)']}

# Expected Behavior
${formResponseMap['Expected behavior']}

# Actual Behavior
${formResponseMap['Actual behavior']}
    `
  return body;
}

/**
 * Constructs a list of fields with the value and name to be added to the draft issue.
 * For example, if you want to update a TEXT field named "Priority" to "High" on the draft issue, 
 * you would add the field to the list with the name "Priority" and the value "High".
 *
 * NOTE - SINGLE_SELECT fields must be given a value that exists in the field's options otherwise
 * this would fail.
 *
 * @param {Object} formResponseMap - The form response data.
 * @returns {Array} - The list of fields to be added to the draft issue.
 */
function buildFields(formResponseMap) {
  const fields = [
    {
      value: "Support Ticket",
      name: "Source",
    },
    {
      value: formResponseMap['Priority Level'],
      name: "Stakeholder Perceived Priority",
    },
    {
      value: formResponseMap['email'],
      name: "Submitted By",
    }
  ]

  return fields;
}

/**
 * Constructs the title of the draft issue to be created using the form response data.
 * @param {Object} formResponseMap - The form response data.
 * @returns {String} - The title of the draft issue.
 */
function buildTitle(formResponseMap) {
  return formResponseMap['What is the bug? (in one sentence please)']
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/*
 * Function executed on form submission that creates a draft issue on github project v2 board
 * using the form response data.
 */
async function OnFormSubmit(e) {
  // Parse the response into a JSON object for easier handling
  const formResponseParser= new GoogleFormResponseParser(FormApp)
  const formResponseMap = formResponseParser.fetchResponseJSON() 

  // Build the issue title, body, and custom fields
  const title = buildTitle(formResponseMap)
  const body = buildDraftIssueBody(formResponseMap)
  const fields = buildFields(formResponseMap)

  // Initialize the client for communicating with the Github Project V2 API
  const githubClient = new GitHubProjectsV2Client(githubAuthToken, githubProjectV2Id);

  // Create the issue
  const issueId = await githubClient.createIssue(title, body, fields);
  
  Logger.info("Issue created with title: " + title + " and ID: " + issueId)
}
