function scheduleCron() {

  // Description: Daily Auto-Cron, use a Daily Task as a switch to avoid the Auto-Cron
  // Usage: set up ID, token and the exact name of the Daily Task.
  // Also input the buff skillId (check list below) and number of times to shoot it (ntimes)
  // If you check the task before Cron time, Cron will be executed, otherwise it won't.
  // Don't forget to set the auto-scheduler to run automatically after midnight :)
  // Credits: original Cron and Buff Scripts by cTheDragons https://goo.gl/2KauV3
  // Mod by SirLouen, 17th Oct 2018
  // ChangeLog:
  // 19th Oct 2018 - Merged Buff script with Cron script
  // 18th Oct 2018 - Checks if Cron daily has run once already

  var habId = "#HabiticaUserID#"; // Example: var habId = "dea23111-11aa-8745dc-8731a385b12c";
  var habToken = "#HabiticaAPIToken#"; // Example: var habToken = a312da21-12ad-543ca-74534432ea32";
  var dailyTaskName = "#NameOfQuestToAvoidAutoCron#"; // Example: var dailyTaskName = "Cron Daily";
  var ntimes = "#NumberOfBuffsPerDay#"; // Example: var ntimes = 8;
  var skillId = "#SkillNameCheckTableBelow#"; // Example: var skillId ="valorousPresence";

  /*
    Below is a list  of options of the party buff skills. Replace the value in skillId above for the skill you desire. Ensure you copy the quotes.
  See http://habitica.wikia.com/wiki/Skills for more information on skills.
  Options for skills:
    Warrior Valourous Presence (STR): "valorousPresence"
    Warrior Intimidating Gaze (CON): "intimidate"
    Rogue Tools of Trade (PER): "toolsOfTrade"
    Healer Protective Aura (CON): "protectAura"
    Healer Blessing (HP): "healAll"
    Mage Ethereal Surge (mana): "mpheal"
    Mage EarthQuake (INT): "earth"
  */

  var url = "https://habitica.com/api/v3/user/class/cast/" + skillId;
  var sleepTime = 200;

  // Yersterday is the desired date
  var desiredDate = new Date();
  desiredDate.setDate(desiredDate.getDate() - 1);

  var getParamsTemplate = {
   "method" : "get",
   "headers" : {
     "x-api-user" : habId,
     "x-api-key" : habToken
    }
  }
  var postParamsTemplate = {
   "method" : "post",
   "headers" : {
     "x-api-user" : habId,
     "x-api-key" : habToken
    }
  }

  // Getting the task we need
  var urlRequest = "https://habitica.com/api/v3/tasks/user?type=dailys";
  var response = UrlFetchApp.fetch(urlRequest, getParamsTemplate);
  var tasks = JSON.parse(response).data;
  var taskIndex = findTask(tasks,dailyTaskName);

  // If no taskIndex found, then end execution
  if (!taskIndex){
    Loggger.log("No avoid task set");
    return;
  }

  var taskId = tasks[taskIndex]["id"];

  // Getting the last day we did the task
  var urlRequest = "https://habitica.com/api/v3/tasks/"+taskId;
  var response = UrlFetchApp.fetch(urlRequest, getParamsTemplate);
  var taskHistory = JSON.parse(response).data.history;

  // If the task has never been run
  if (!taskHistory.length)
    return;

  var lastTaskDate = new Date(taskHistory[taskHistory.length-1]["date"]);

  // Cron only if yesterday (desired date) was the last day we did the task
  if (desiredDate.getDate() === lastTaskDate.getDate()) {
   Logger.log("Executing Cron");
   UrlFetchApp.fetch("https://habitica.com/api/v3/cron", postParamsTemplate);
   Utilities.sleep(10000);// pause for 10K milliseconds (10s) to avoid server issues
  }
  else {
    Logger.log("Can't execute Cron");
  }
  // Launch buffs regardless of Cron
  for (var i = 0; i < ntimes; i++) {
   UrlFetchApp.fetch(url, postParamsTemplate);
   Utilities.sleep(sleepTime);// pause in the loop for 200 milliseconds; //This is to avoid buff being swallowed up from servers too busy.
  }
}

function findTask(tasks,dailyTaskName){
 var i = 0;
 do {
   if (tasks[i]["text"]==dailyTaskName){
     return i;
   }
 i++;
 }
 while (i < tasks.length);
 return 0;
}
