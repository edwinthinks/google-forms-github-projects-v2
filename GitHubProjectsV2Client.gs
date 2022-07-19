/**
 * GitHubProjectsV2Client is a class that provides helpful functions to interact 
 * with the GitHub GraphQL service in Google Forms for the purposes of creating 
 * and updating GitHub Project V2 draft issues from a Google Form response.
 *
 * WARNING - the GraphQL API is a beta feature. The GraphQL API may be changed and
 * thus prevent this class from working as expected.
 *
 * NOTE - this if for GitHub Projects V2 only!
 */

class GitHubProjectsV2Client {

  /**
   * Constructor
   * @param {authToken} authToken - GitHub auth token
   * @param {projectId} projectId - GitHub project ID (Find your project ID by following this guide - https://docs.github.com/en/enterprise-cloud@latest/issues/trying-out-the-new-projects-experience/using-the-api-to-manage-projects#finding-information-about-projects)
   */
  constructor(authToken, projectId) {
    this.authToken = authToken;
    this.projectId = projectId;
  }

  /**
   * Creates a new draft issue in the GitHub project V2
   * @param {string} title - Title of the issue
   * @param {string} body - Body of the issue (supports Markdown)
   * @param {Object} fields - Custom fields to add to the issue. The key must match the field name.
   * @returns {string} - ID of the created issue
   */
  async createIssue(title, body, fields) {
    // Create a new draft issue for the project using the GraphQL API
    const createIssueQuery = `
      mutation {
        addProjectV2DraftIssue(input: {projectId: \"${this.projectId}\", title: \"${title}\", body: \"${body}\"}) { projectItem { id }}
      }
    `;

    const res = await this.postGraphqlQuery(createIssueQuery);

    // Get the issue ID from the response
    const responseBodyJSON = JSON.parse(res.getContentText());
    Logger.log(responseBodyJSON);
    const issueId = responseBodyJSON.data.addProjectV2DraftIssue.projectItem.id;

    // Generate mutation to add custom fields to the issue
    const fieldsMap = await this.fetchFields();
    
    // Transform fields into corresponding mutation queries and join them together
    const fieldMutations = fields.reduce((acc, field) => {
      const githubField = fieldsMap[field.name];
      const githubFieldType = githubField.dataType;

      let payloadValue = {};

      switch (githubFieldType) {
        case 'TEXT':
          payloadValue = `{ text: \"${field.value}\" }`;
          break;
        case 'NUMBER':
          payloadValue = `{ number: \"${field.value}\" }`;
          break;
        case 'DATE':
          payloadValue = `{ date: \"${field.value}\" }`;
          break;
        case 'SINGLE_SELECT':
          // Find the option ID for the option with the matching value
          const optionId = githubField.options.find(option => option.name === field.value).id;
          payloadValue = `{ singleSelectOptionId: \"${optionId}\" }`;
          break;
      }

      const mutation = `
        mutation${githubField.id}: updateProjectV2ItemFieldValue(input: {
          itemId: \"${issueId}\", projectId: \"${this.projectId}\", fieldId: \"${githubField.id}\", value: ${payloadValue
        }}) { clientMutationId }
      `;

      acc = acc.concat(mutation);
      return acc;
    }, '');

    // Send the mutation to the GraphQL API to update labels
    const updateIssueQuery = `
      mutation UpdateLabels {
        ${fieldMutations}
      }
    `;

    const r = await this.postGraphqlQuery(updateIssueQuery);
    return issueId;
  }

  /**
   * Fetch a map of custom fields to their ids for the project.
   * @returns {object} - Map of custom field names to their data types and ids
   */
  async fetchFields() {
    const res = await this.postGraphqlQuery(`
      query{ node(id: \"${this.projectId}\") { ... on ProjectV2 { fields(first: 20) { nodes { ... on ProjectV2Field { id dataType name } ... on ProjectV2IterationField { id name dataType configuration { iterations { startDate id }}} ... on ProjectV2SingleSelectField { id name dataType options { id name }}}}}}}
    `)

    const responseBodyJSON = JSON.parse(res.getContentText());

    const fields = responseBodyJSON.data.node.fields.nodes.reduce((acc, field) => {
      acc[field.name] = field;
      return acc;
    }, {});

    return fields
  }

  /**
   * Send a GraphQL query to the GitHub GraphQL API
   * @param {string} query - GraphQL query
   * @returns {object} - Response from the GraphQL API
   */
  postGraphqlQuery(query) {
    // Utilize the UrlFetchApp library to make a POST request to the GitHub GraphQL API
    const response = UrlFetchApp.fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.authToken}`
      },
      payload: JSON.stringify({query: query})
    });

    return response;
  }
}

