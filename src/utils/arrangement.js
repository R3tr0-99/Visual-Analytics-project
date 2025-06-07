/*
*
*/
export function normalizeArrangement(arrangement) {
    // arrangement is in the form of array of dimension index eg. [0,3,1,4]
    // the function rotates and reflect the arrangement to have (arrangement[0] = 0 && arrangement[1] < arrangement[-1])
    const res = arrangement.map(d => d);
    while (res[0] != 0) {
        let dim = res.shift();
        res.push(dim);
    }
    if (res[1] > res[res.length - 1]) {
        let dim = res.shift();
        res.reverse();
        res.unshift(dim);
    }
    return res;
}

/*
*
*/
export function maxMeanDistanceHeuristic(data) {
    const set = data.dimensions.map(d => d.values);
    const entriesSum = set[0]
        .map((_, entryIndex) =>
            set.map((_, dimensionIndex) => set[dimensionIndex][entryIndex])
        )
        .map(valueDimensions =>
            valueDimensions.reduce((sumValues, currentValue) => sumValues + currentValue, 0)
        );

    console.log('set', set);
    console.log('entriesSum', entriesSum);

    const dimensionsSum = set.map(dimension => dimension.reduce((a, b) => a + b, 0));
    const dimensionsByRank = dimensionsSum
        .map((sum, i) => ({ i, sum }))
        .sort((a, b) => a.sum <= b.sum ? 1 : -1)
        .map(o => o.i);

    const normalizedSet = set.map(dimensionValues =>
        dimensionValues.map((entryValue, entryIndex) =>
            entriesSum[entryIndex] > 0 ? entryValue / entriesSum[entryIndex] : 0
        )
    );

    let availablePositions = set.map((_, i) => i);
    const assignedPositions = [];

    console.log('dimensionsSum', dimensionsSum);
    console.log('dimensionsByRank', dimensionsByRank);
    console.log('normalizedSet', normalizedSet);
    console.log('availablePositions', availablePositions);
    console.log('--- END INIT ---');

    let pointsAssignedPositions = set[0].map(_ => [0, 0]);
    const arrangement = Array(set.length).fill(null);

    for (const [rankIndex, dimensionIndex] of dimensionsByRank.entries()) {
        let currentPosition;
        if (rankIndex === 0) {
            currentPosition = 0;
        } else if (rankIndex === dimensionsByRank.length - 1) {
            currentPosition = availablePositions[0];
        } else {
            let currentDimensionValues = normalizedSet[dimensionIndex];
            let othersDimensionsByRank = dimensionsByRank.slice(rankIndex + 1);
            let othersDimensionsValues = othersDimensionsByRank.map(
                idx => normalizedSet[idx]
            );
            let othersMeanValues = othersDimensionsValues[0]
                .map((_, entryIndex) =>
                    othersDimensionsByRank
                        .map((_, otherIdx) => othersDimensionsValues[otherIdx][entryIndex])
                        .reduce((sum, v) => sum + v, 0) / othersDimensionsByRank.length
                );

            console.log('currentDimensionValues', currentDimensionValues);
            console.log('othersDimensionsByRank', othersDimensionsByRank);
            console.log('othersDimensionsValues', othersDimensionsValues);
            console.log('othersMeanValues', othersMeanValues);

            let currentMagnitude = -Infinity;
            for (const possiblePosition of availablePositions) {
                console.log('possiblePosition', possiblePosition);
                let otherPositions = availablePositions.filter(pos => pos !== possiblePosition);
                console.log('otherPositions', otherPositions);

                let pointsPossible = pointsAssignedPositions.map(point => point.slice());
                pointsPossible = pointsPossible.map(([x1, x2], entryIndex) => [
                    x1 + normalizedSet[dimensionIndex][entryIndex] *
                    Math.cos(2 * Math.PI * possiblePosition / set.length),
                    x2 + normalizedSet[dimensionIndex][entryIndex] *
                    Math.sin(2 * Math.PI * possiblePosition / set.length)
                ]);

                for (const otherPosition of otherPositions) {
                    pointsPossible = pointsPossible.map(([x1, x2], entryIndex) => [
                        x1 + othersMeanValues[entryIndex] *
                        Math.cos(2 * Math.PI * otherPosition / set.length),
                        x2 + othersMeanValues[entryIndex] *
                        Math.sin(2 * Math.PI * otherPosition / set.length)
                    ]);
                }

                console.log('pointsPossiblePositions', pointsPossible);
                let possibleMagnitude =
                    pointsPossible
                        .map(([x1, x2]) => Math.hypot(x1, x2))
                        .reduce((p, c) => p + c, 0) / pointsPossible.length;
                console.log('possibleMagnitude', possibleMagnitude);
                if (possibleMagnitude > currentMagnitude) {
                    currentPosition = possiblePosition;
                    currentMagnitude = possibleMagnitude;
                }
            }
            console.log('currentPosition', currentPosition);
        }
        arrangement[currentPosition] = dimensionIndex;
        assignedPositions.push(currentPosition);
        availablePositions.splice(availablePositions.indexOf(currentPosition), 1);
        pointsAssignedPositions = pointsAssignedPositions.map(([x1, x2], entryIndex) => [
            x1 + normalizedSet[dimensionIndex][entryIndex] *
            Math.cos(2 * Math.PI * currentPosition / set.length),
            x2 + normalizedSet[dimensionIndex][entryIndex] *
            Math.sin(2 * Math.PI * currentPosition / set.length)
        ]);
        console.log('availablePositions', availablePositions);
        console.log('pointsAssignedPositions', pointsAssignedPositions);
        console.log('arrangement', arrangement);
    }
    return arrangement;
}

/*
*
*/
export function minEffectivenessErrorHeuristic(data, fast = false) {
    function arrangementCost(costMatrix, arr) {
        let cost = 0;
        for (let i = 0; i < arr.length; i++) {
            let j = (i + 1) % arr.length;
            cost += costMatrix[arr[i]][arr[j]];
        }
        return cost;
    }
    function arrangementSwap(arr, i, j) {
        let result = arr.slice();
        let tmp = result[i];
        result[i] = result[j];
        result[j] = tmp;
        return result;
    }
    const m = data.entries.length;
    const n = data.dimensions.length;
    const k = n * 2;
    const C = Array.from({ length: n }, () => Array(n).fill(0));
    for (let j = 0; j < n; j++) C[j][j] = Infinity;
    for (let i = 0; i < m; i++) {
        let delta = 0;
        for (let dim1 = 0; dim1 < n; dim1++) {
            for (let dim2 = 0; dim2 < n; dim2++) {
                delta += Math.abs(
                    data.dimensions[dim1].values[i] -
                    data.dimensions[dim2].values[i]
                );
            }
        }
        for (let dim1 = 0; dim1 < n; dim1++) {
            for (let dim2 = 0; dim2 < n; dim2++) {
                if (dim1 === dim2) continue;
                if (delta !== 0) {
                    C[dim1][dim2] +=
                        Math.abs(
                            data.dimensions[dim1].values[i] -
                            data.dimensions[dim2].values[i]
                        ) / delta;
                }
            }
        }
    }
    let bestArr = null;
    let bestCost = Infinity;
    for (let start = 0; start < n; start++) {
        let arr = [start];
        while (arr.length < n) {
            let cand = { dim: null, cost: Infinity, pos: 'right' };
            for (let d = 0; d < n; d++) {
                if (arr.includes(d)) continue;
                const left = C[arr[0]][d];
                const right = C[arr[arr.length - 1]][d];
                const cost = Math.min(left, right);
                const pos = left < right ? 'left' : 'right';
                if (cost < cand.cost) cand = { dim: d, cost, pos };
            }
            if (cand.pos === 'left') arr.unshift(cand.dim);
            else arr.push(cand.dim);
            if (!fast && arr.length > 2) {
                let improved = true;
                let steps = 0;
                let A = arr.slice();
                while (improved && steps++ < k) {
                    improved = false;
                    let currentCost = arrangementCost(C, A);
                    for (let i = 0; i < A.length; i++) {
                        const j = (i + 1) % A.length;
                        const B = arrangementSwap(A, i, j);
                        const newCost = arrangementCost(C, B);
                        if (newCost < currentCost) {
                            A = B;
                            currentCost = newCost;
                            improved = true;
                        }
                    }
                }
                arr = A;
            }
        }
        const cost = arrangementCost(C, arr);
        if (cost < bestCost) {
            bestCost = cost;
            bestArr = arr;
        }
    }
    return normalizeArrangement(bestArr);
}

/*
*
*/
export function minEffectivenessErrorHeuristicFast(data) {
    return minEffectivenessErrorHeuristic(data, true);
}

/*
*
*/
export function clockHeuristic(data) {
    const vec = data.representativeEntry.vector
        .map((v, i) => ({ dimensionIndex: i, val: v }))
        .sort((a, b) => b.val - a.val);

    const arrangement = [];
    vec.forEach((d, i) => {
        if (i % 2 === 0) arrangement.unshift(d.dimensionIndex);
        else arrangement.push(d.dimensionIndex);
    });
    return normalizeArrangement(arrangement);
}