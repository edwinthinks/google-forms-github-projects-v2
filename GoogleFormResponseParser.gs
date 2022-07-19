/**
 * GoogleFormResponseParser is a parser for Google Forms that transforms responses
 * into a JSON object for use in other applications or integrations. 
 *
 * The problem this fixes is that Google Forms doesn't out of the box support 
 * output a easily manageable data structure of a response. This parser will 
 * transform the responses into a JSON object that it is easier to manage and
 * use for other purposes. For example, this parser was originally used as a 
 * intermediate transformation to build a body to a POST request to a web service 
 * like GitHub API.
 */

class GoogleFormResponseParser {
  /**
   * Constructor
   * @param {FormApp} form - FormApp object for the Google Form you want to parse
   */
  constructor(formApp) {
    this.form = formApp.getActiveForm();
    this.latestFormResponses = this.form.getResponses().pop().getItemResponses();
  }

  /**
   * Returns JSON object that maps question text to the response
   * @returns {Object} - JSON object that maps question text to the response
   */
  fetchResponseJSON() {
    /**
     * Map question IDs to question text so we can map the responses to the
     * questions.
     */
    const questionMap = this.form.getItems().reduce((acc, item) => {
      acc[item.getId()] = item.getTitle();
      return acc;
    }, {});

    /**
     * Map questions text to responses
     */
    const responseMap = this.latestFormResponses.reduce((acc, response) => {
      const questionText = questionMap[response.getItem().getId()];
      const responseText = response.getResponse();
      acc[questionText] = responseText;
      return acc;
    }, {});

    /**
     * Include email if it exists
     */
    const email = this.form.getResponses().pop().getRespondentEmail()
    if (email) {
      responseMap.email = email;
    }

    return responseMap;
  }
}
