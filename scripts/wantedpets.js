function printMostWantedQuests() {

  // Description: Prints Most Wanted Quests for a given party
  // and the list of owners for those quests
  // Usage: set up ID, token
  // Credits: original printMostWantedQuests script by Lucubro
  // Mod by SirLouen, 28th Oct 2018

  var habId = "#HabiticaUserID#";
  var habToken = "#HabiticaAPIToken#";

  // A list of all the pets we're interested in.
  // todo: extract the whole list automatically with API content
  // todo: implement bans for party full quests
  const questPetNames = [
    "Armadillo", "Axolotl", "Badger", "Beetle", "Bunny", "Butterfly", "Cheetah", "Cow", "Cuttlefish", "Cheetah", "Deer",
    "Egg", "Falcon", "Ferret", "Frog", "Gryphon", "GuineaPig", "Hedgehog", "Hippo", "Horse", "Kangaroo", "Monkey", "Nudibranch", "Octopus", "Owl", "Parrot",
    "Peacock", "Penguin", "Pterodactyl", "Rat", "Rock", "Rooster", "Sabretooth", "SeaSerpent", "Seahorse", "Sheep", "Slime", "Sloth", "Snail", "Snake",
    "Spider", "Squirrel", "TRex", "Treeling", "Triceratops", "Turtle", "Unicorn", "Whale", "Yarn", "Alligator"
  ];

  // Retrieve the list of party members with their IDs.
  var paramsTemplate = {
    "method": "get",
    "headers": {
      "x-api-user": habId,
      "x-api-key": habToken
    }
  }

  // Build a dictionary memberName -> memberID.
  var partyMembers = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/groups/party/members", paramsTemplate));
  var memberName;
  var memberID;
  var membersIDs = {};
  var i;
  for (i = 0; i < partyMembers.data.length; i++) {
    memberName = partyMembers.data[i]["profile"]["name"];
    memberID = partyMembers.data[i]["id"];
    membersIDs[memberName] = memberID;
  }

 // Build a dictionary scrollName -> petName
  var quests = JSON.parse(UrlFetchApp.fetch("https://habitica.com/api/v3/content", paramsTemplate)).data.quests;
  var drop;
  var petsQuests = {};
  for (property in quests){
    drop = quests[property].drop;
    if (drop.hasOwnProperty('items'))
      if (drop.items[0].type == 'eggs')
         petsQuests[property]=drop.items[0].key;
  }

  // ------------ //
  // COLLECT DATA //
  // ------------ //

  // Variables used to collect the quest pet data.
  var urlRequest = "https://habitica.com/api/v3/members/";
  var memberProfile;
  var fullPetName;
  var petName;
  var memberPetsAndMounts;

  // Collect the data.
  var membersPetCounts = {}; // Quest pet counts by member.
  var partyPetCounts = {}; // Total quest pet counts.
  var questScrolls; // Total pet quests scrolls available
  var memberScrolls = {};

  // Initialize total quest pet counts.
  for (i = 0; i < questPetNames.length; i++) {
    petName = questPetNames[i];
    partyPetCounts[petName] = 0.0;
    memberScrolls[petName] = [];
  }

  for (var memberName in membersIDs) {
    membersPetCounts[memberName] = {}; // Initialize member data.
    memberID = membersIDs[memberName];
    memberProfile = JSON.parse(UrlFetchApp.fetch(urlRequest + memberID, {"method" : "get"}));

    // Collect data about scroll quests by member
    questScrolls = memberProfile.data.items.quests;
    for(var questName in questScrolls)
      if(questScrolls[questName] > 0 && petsQuests[questName] != null)
          memberScrolls[petsQuests[questName]].push(memberName);

    // Collect data about unhatched eggs of quest pets.
    for (i = 0; i < questPetNames.length; i++) {
      petName = questPetNames[i];
      if (petName in memberProfile.data.items.eggs) {
        membersPetCounts[memberName][petName] = memberProfile.data.items.eggs[petName]
      } else {
        membersPetCounts[memberName][petName] = 0.0;
      }
    }

    // Collect data about all the hatched pets and mounts.
    memberPetsAndMounts = Object.keys(memberProfile.data.items.pets)
    memberPetsAndMounts = memberPetsAndMounts.concat(Object.keys(memberProfile.data.items.mounts))
    for (i = 0; i < memberPetsAndMounts.length; i++) {
      petName = memberPetsAndMounts[i].split("-")[0];
      // Add only info about quest pets.
      if (petName in membersPetCounts[memberName]) {
        membersPetCounts[memberName][petName] += 1;
      }
    }

    // Cut maximum number of pets+mounts+eggs to 20 and update total counts.
    for (petName in membersPetCounts[memberName]) {
      membersPetCounts[memberName][petName] = Math.min(20, membersPetCounts[memberName][petName])
      partyPetCounts[petName] += membersPetCounts[memberName][petName]
    }
  }

  // ------------------------ //
  // ORDER PET QUESTS BY NEED //
  // ------------------------ //

  var sortedPetQuests = Object.keys(partyPetCounts).sort(function(a,b){return partyPetCounts[a]-partyPetCounts[b]})
  for (i = 0; i < sortedPetQuests.length; i++) {
    petName = sortedPetQuests[i];
    Logger.log(partyPetCounts[petName].toString() + " | " + petName + ": " + memberScrolls[petName])
  }
}
