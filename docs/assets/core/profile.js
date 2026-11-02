import { OPERATORS } from './vocabulary.js';
export const CAPABILITIES = {
    assert: { title: 'Describe a situation', description: 'Express a basic fact or event', operators: ['EVENT'] },
    deny: { title: 'Deny a proposition', description: 'Express that something is not the case', operators: ['NOT'] },
    ask: { title: 'Seek confirmation', description: 'Ask whether something is the case', operators: ['ASK'] },
    ability: { title: 'Express ability', description: 'Say whether someone can do something', operators: ['CAN'] },
    desire: { title: 'Express desire', description: 'Say what someone wants to do', operators: ['WANT'] },
    situate: { title: 'Situate in time', description: 'Locate an event in time', operators: ['WHEN'] },
    request: { title: 'Polite help request', description: 'Request help politely', operators: ['CAN', 'ASK', 'PLEASE'] },
};
const DEPENDENCIES = {
    EVENT: [],
    CAN: ['EVENT'],
    WANT: ['EVENT'],
    NOT: ['EVENT'],
    WHEN: ['EVENT'],
    ASK: ['EVENT'],
    PLEASE: ['ASK'],
    WHERE: [],
    PRICE: [],
};
/**
 * Calculate a dependency closure, not a claim about optimal learning effort.
 * Operators are reported in specification order for reproducible profiles.
 */
export function deriveProfile(goals) {
    if (goals.length === 0) {
        throw new TypeError('Select at least one capability');
    }
    const required = new Set();
    const visited = new Set();
    function include(operator) {
        if (visited.has(operator))
            return;
        visited.add(operator);
        const dependencies = DEPENDENCIES[operator];
        if (!dependencies)
            throw new TypeError(`Unknown operator: ${operator}`);
        for (const dependency of dependencies)
            include(dependency);
        required.add(operator);
    }
    for (const goal of goals) {
        const capability = CAPABILITIES[goal];
        if (!capability)
            throw new TypeError(`Unknown capability: ${goal}`);
        for (const operator of capability.operators)
            include(operator);
    }
    const ordering = OPERATORS.map(({ id }) => id);
    return Object.freeze({
        goals: [...new Set(goals)],
        operators: ordering.filter((id) => required.has(id)),
        omitted: ordering.filter((id) => !required.has(id)),
    });
}
