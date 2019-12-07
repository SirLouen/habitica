// Description: scheduleQuestStart function automatically force-start a quest after 
// a given time from the first time it was found launched and inactive.
// Usage: Set waitingTime variable if you need to update the time to
// wait between sending the invites and starting the quest.
// An scheduler should be set to run scheduleQuestStart every X minutes (5-15 min ideal)
// Also PM variables should be set up in the sendPMs function below
//
// Credits: Original Quest Scheduler and auto PM scripts by Lucubro and SirLouen
//

function scheduleQuestStart() {
   
    // Set these variables only once.
    var waitingTime = 4; // Time from quest initiation to launch
    var habId = "#HabiticaUserID#"; // Your Habitica API user ID
    var habToken = "#HabiticaAPIToken#"; // Your Habitica API key token
    
    // Useful variables.  
    var driveFileName = "Habitica-scheduleQuestStart.log";
    var now = new Date();
   
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
   
    // Retrieve info about the current party quest.
    var urlRequest = "https://habitica.com/api/v3/groups/party";
    var response = UrlFetchApp.fetch(urlRequest, getParamsTemplate);
    var party = JSON.parse(response);
    var currentQuestKey = party.data.quest.key;
    var currentFileContent = now + "\n" + currentQuestKey;
   
    // If there is a quest already active, there's nothing to do.
    // Last mod 15/10/2018: if it's inactive we might be sending a PM (see below)
    if (party.data.quest.active) {
      Logger.log("Quest already active.");
      return
    }
   
    // Create the file if it doesn't exist.
    var files = DriveApp.getFilesByName(driveFileName);
    if (!files.hasNext()) {
      Logger.log("Creating Google Drive file...");
      DriveApp.createFile(driveFileName, currentFileContent);
      return
    }
   
    // Retrieve information about previous script run.
    var driveFile = files.next();
    var driveFileContent = driveFile.getAs("text/plain").getDataAsString().split("\n");
    var previousQuestDate = new Date(driveFileContent[0]);
    var previousQuestKey = driveFileContent[1];
   
    // If this is the first time there's no quest going on, send a PM to everybody.
    if (currentQuestKey == undefined) {
      Logger.log("No quest is currently active.");
      if (previousQuestKey != "undefined") {
        Logger.log("Sending PM...");
        sendPMs();
        // Update file so that we won't send the PM on the next trigger.
        driveFile.setContent(currentFileContent);
      }
      return;
    }
    
    // If this is a NEW inactive quest, then store the data in the file.
    if (currentQuestKey != previousQuestKey) {
      Logger.log("Found new inactive quest. Storing information...")
      driveFile.setContent(currentFileContent);
      return
    }
   
    // If this is an OLD inactive quest, then check if we need to force-start it.
    var startTime = previousQuestDate;
    startTime.setHours(startTime.getHours() + waitingTime);
    if (now >= startTime) {
      Logger.log("Force-starting the quest...");
      urlRequest = "https://habitica.com/api/v3/groups/party/quests/force-start";
      UrlFetchApp.fetch(urlRequest, postParamsTemplate);
    } 
    else {
      Logger.log("Waiting for starting time for quest " + currentQuestKey + "...");
    }
}

function sendPMs() {
  
    // Set these variables only once.
    var habId = "#HabiticaUserID#";
    var habToken = "#HabiticaAPIToken#";
    var groupID = "265c4795-1bf5-4c2c-bda3-6a3e74ae4657"; // Habitica Party ID
    var userExceptions = [
        // List of Users to be removed from the auto PM list
        "ExampleUsername1", "ExampleUsername2"
      ];

    // Useful variables.  
    var now = new Date();
   
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
    
    var message = "The quest is over. You can launch a new quest now.";
   
    // Prepare POST parameters.
    postParamsTemplate["payload"] = {
      "message" : message,
      "toUserId" : undefined
    };
   
    var partyMembers = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/" + groupID + "/members", getParamsTemplate)).data;
    var lastMemberId= partyMembers[(partyMembers.length)-1]["id"];
    partyMembers = partyMembers.concat(JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/" + groupID + "/members?lastId="+lastMemberId, getParamsTemplate)).data);
    
    // Build a dictionary memberName -> memberID.
    var memberName;
    var memberID;
    for (var i = 0; i < partyMembers.length; i++) {
      // Do not send a PM to users that don't want to.
      memberName = partyMembers[i]["profile"]["name"];
      
      if (userExceptions.indexOf(memberName) >= 0) {
        continue;
      }
      // Send PM.
      memberID = partyMembers[i]["id"];
      var objectionURL = "https://habitica.com/api/v3/members/" + memberID + "/objections/send-private-message";
      var objectionData = JSON.parse(UrlFetchApp.fetch(objectionURL, getParamsTemplate)); 
      var arrayObjection = objectionData["data"];
   
      postParamsTemplate["payload"]["toUserId"] = memberID;
      // If no objections then launch the message
      if (!(typeof arrayObjection !== 'undefined' && arrayObjection.length > 0)) {
        UrlFetchApp.fetch("https://habitica.com/api/v3/members/send-private-message", postParamsTemplate);
        //Logger.log("Sending MP to: " + memberName);
      }
    }
  }