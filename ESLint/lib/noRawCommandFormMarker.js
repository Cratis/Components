// The identifiers a CommandForm child is recognised by, and the helpers that own each one.
const MARKERS = {
    CommandFormField: { mark: 'markAsCommandFormField', predicate: 'isCommandFormField' },
    CommandFormColumn: { mark: 'markAsCommandFormColumn', predicate: 'isCommandFormColumn' },
};

const EQUALITY = new Set(['===', '!==', '==', '!=']);

// True for `x.displayName` and `x['displayName']`.
const isDisplayNameMember = node =>
    node?.type === 'MemberExpression' &&
    (node.computed
        ? node.property?.type === 'Literal' && node.property.value === 'displayName'
        : node.property?.type === 'Identifier' && node.property.name === 'displayName');

const markerFor = node =>
    node?.type === 'Literal' && typeof node.value === 'string'
        ? MARKERS[node.value]
        : undefined;

// Disallow hand-writing the `displayName` strings that identify a CommandForm field or
// column, in either direction — stamping one onto a component, or comparing against one to
// decide what a child is.
//
// `displayName` is React's public, writable diagnostic name and a routine target for build
// tooling: Storybook's `reactDocgen: 'react-docgen-typescript'` setting rewrites it by
// default. A component identified only by that string stops being recognised the moment
// anything renames it, and it fails silently — the field simply renders with no container,
// so no label, no bound value and no change handler, with no error and no warning.
//
// The helpers in '@cratis/components/CommandForm' set and read a `Symbol.for` marker that a
// rename cannot reach, and keep the legacy `displayName` alongside it for compatibility, so
// going through them is both safer and strictly more permissive than the literal.
export const noRawCommandFormMarker = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow identifying CommandForm fields and columns by a raw displayName string; use the marker helpers.',
            recommended: true,
            url: 'https://github.com/Cratis/Components/blob/main/ESLint/README.md',
        },
        schema: [],
        messages: {
            useMarkHelper:
                "Do not stamp displayName = '{{name}}' by hand — a build transform that rewrites displayName silently unbinds this component. Use {{helper}}() from '@cratis/components/CommandForm'.",
            usePredicate:
                "Do not identify a CommandForm child by comparing displayName to '{{name}}' — a component whose displayName was rewritten is missed. Use {{helper}}() from '@cratis/components/CommandForm'.",
        },
    },
    create(context) {
        const report = (node, messageId, helper, name) =>
            context.report({ node, messageId, data: { helper, name } });

        return {
            // C.displayName = 'CommandFormField'
            AssignmentExpression(node) {
                if (node.operator !== '=' || !isDisplayNameMember(node.left)) return;
                const marker = markerFor(node.right);
                if (marker) report(node, 'useMarkHelper', marker.mark, node.right.value);
            },

            // { displayName: 'CommandFormField' } — e.g. via Object.assign
            Property(node) {
                const key = node.computed ? undefined : node.key;
                const named =
                    (key?.type === 'Identifier' && key.name === 'displayName') ||
                    (key?.type === 'Literal' && key.value === 'displayName');
                if (!named) return;
                const marker = markerFor(node.value);
                if (marker) report(node, 'useMarkHelper', marker.mark, node.value.value);
            },

            // child.displayName === 'CommandFormField' (either operand order)
            BinaryExpression(node) {
                if (!EQUALITY.has(node.operator)) return;
                const [member, literal] = isDisplayNameMember(node.left)
                    ? [node.left, node.right]
                    : [node.right, node.left];
                if (!isDisplayNameMember(member)) return;
                const marker = markerFor(literal);
                if (marker) report(node, 'usePredicate', marker.predicate, literal.value);
            },
        };
    },
};

export default noRawCommandFormMarker;
