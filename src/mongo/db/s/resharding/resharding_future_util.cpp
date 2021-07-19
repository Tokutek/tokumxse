/**
 *    Copyright (C) 2021-present MongoDB, Inc.
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the Server Side Public License, version 1,
 *    as published by MongoDB, Inc.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    Server Side Public License for more details.
 *
 *    You should have received a copy of the Server Side Public License
 *    along with this program. If not, see
 *    <http://www.mongodb.com/licensing/server-side-public-license>.
 *
 *    As a special exception, the copyright holders give permission to link the
 *    code of portions of this program with the OpenSSL library under certain
 *    conditions as described in each individual source file and distribute
 *    linked combinations including the program with the OpenSSL library. You
 *    must comply with the Server Side Public License in all respects for
 *    all of the code used other than as permitted herein. If you modify file(s)
 *    with this exception, you may extend this exception to your version of the
 *    file(s), but you are not obligated to do so. If you do not wish to do so,
 *    delete this exception statement from your version. If you delete this
 *    exception statement from all source files in the program, then also delete
 *    it in the license file.
 */

#include "mongo/platform/basic.h"

#include "mongo/db/s/resharding/resharding_future_util.h"

namespace mongo::resharding {

std::vector<ExecutorFuture<void>> thenRunAllOn(const std::vector<SharedSemiFuture<void>>& futures,
                                               ExecutorPtr executor) {
    std::vector<ExecutorFuture<void>> result;
    result.reserve(futures.size());

    for (const auto& future : futures) {
        result.emplace_back(future.thenRunOn(executor));
    }

    return result;
}

ExecutorFuture<void> whenAllSucceedOn(const std::vector<SharedSemiFuture<void>>& futures,
                                      ExecutorPtr executor) {
    return !futures.empty() ? whenAllSucceed(thenRunAllOn(futures, executor)).thenRunOn(executor)
                            : ExecutorFuture(executor);
}

ExecutorFuture<void> cancelWhenAnyErrorThenQuiesce(
    const std::vector<SharedSemiFuture<void>>& futures,
    ExecutorPtr executor,
    CancellationSource cancelSource) {
    return whenAllSucceedOn(futures, executor)
        .onError([futures, executor, cancelSource](Status originalError) mutable {
            cancelSource.cancel();

            return whenAll(thenRunAllOn(futures, executor))
                .ignoreValue()
                .thenRunOn(executor)
                .onCompletion([originalError](auto) { return originalError; });
        });
}

}  // namespace mongo::resharding
