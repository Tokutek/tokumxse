// name: Database Setup Script
// mode: noauth

function setupRun()
{
  'use strict'
  print("Deleting Users:")

  var db = conn.getDB( "admin" )

  db.system.users.find().forEach(
    function(u) {
      print(u._id);
      a.getSiblingDB(u.db).dropUser(u.user)
    }
  )

  // remove the test and other database

  db.getSiblingDB("test").dropDatabase();
  db.getSiblingDB("other").dropDatabase();
  db.getSiblingDB("yetanother").dropDatabase();

  // put some dummy data into each database

  db.getSiblingDB("test").query1.insert({db:'test',date:new ISODate()})
  db.getSiblingDB("other").query1.insert({db:'other',date:new ISODate()})
  db.getSiblingDB("yetanother").query1.insert({db:'yetanother',date:new ISODate()})

  // create the local administrator

  db.createUser({
    user: 'localadmin',
    pwd: 'localadmin9a5S',
    roles: [ 'dbAdmin','userAdmin','readWriteAnyDatabase','userAdminAnyDatabase','dbAdminAnyDatabase' ]
  })
}

setupRun()
