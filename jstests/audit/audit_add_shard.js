// test that enableSharding gets audited

if (TestData.testData !== undefined) {
    load(TestData.testData + '/audit/_audit_helpers.js');
} else {
    load('jstests/audit/_audit_helpers.js');
}

auditTestShard(
    'addShard',
    function(st) {
        var port = allocatePorts(10)[9];
        var conn1 = MongoRunner.runMongod({dbpath: '/data/db/' + jsTestName() + '-extraShard-' + port, port: port,  shardsvr: ""});

        var hostandport = conn1.host;
        const beforeCmd = Date.now();
        assert.commandWorked(st.s0.adminCommand({addshard: hostandport}));

        const beforeLoad = Date.now();
        auditColl = loadAuditEventsIntoCollection(st.s0, getDBPath() + '/auditLog-s0.json', jsTestName(), 'auditEvents');
        assert.eq(1, auditColl.count({
            atype: "addShard",
            ts: withinInterval(beforeCmd, beforeLoad),
            'param.connectionString': hostandport,
            result: 0,
        }), "FAILED, audit log: " + tojson(auditColl.find().toArray()));

        MongoRunner.stopMongod(conn1);
    },
    { /* no special mongod options */ }
);
