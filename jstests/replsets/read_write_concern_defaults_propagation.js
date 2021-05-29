// Tests propagation of RWC defaults across a replica set.
(function() {
'use strict';

load("jstests/libs/read_write_concern_defaults_propagation_common.js");
load("jstests/libs/write_concern_util.js");  // For isDefaultWriteConcernMajorityFlagEnabled.

const rst = new ReplSetTest({nodes: 3});
rst.startSet();
rst.initiate();

const primary = rst.getPrimary();
const secondaries = rst.getSecondaries();

// TODO (SERVER-56642): Fix the test to work with the new default write concern.
if (isDefaultWriteConcernMajorityFlagEnabled(primary)) {
    jsTestLog("Skipping test because the default WC majority feature flag is enabled.");
    rst.stopSet();
    return;
}

ReadWriteConcernDefaultsPropagation.runTests(primary, [primary, ...secondaries]);

// Verify the in-memory defaults are updated correctly. This verifies the cache is invalidated
// properly on secondaries when an update to the defaults document is replicated because the
// in-memory value will only be updated after an invalidation.
ReadWriteConcernDefaultsPropagation.runTests(
    primary, [primary, ...secondaries], true /* inMemory */);

ReadWriteConcernDefaultsPropagation.runDropAndDeleteTests(primary, [primary, ...secondaries]);

rst.stopSet();
})();
