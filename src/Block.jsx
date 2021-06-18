import React from 'react';
import PropTypes from 'prop-types';
import Row from './Row';

function getObjectDeepProperty(obj, path) {
    const parts = path.split('.');
    let val = obj;
    parts.forEach((p) => {
        val = val[p];
    });
    return val;
}

const Block = ({
    title,
    items,
    item,
    groupField,
    attrName,
    editItem,
    fieldPath,
    fieldName,
    getFieldValue,
    setFieldValue,
    token,
}) => {
    const rows = items
        .map((i) => {
            if (i[groupField].id === item.id) {
                return (
                    <Row
                        item={i}
                        editItem={editItem}
                        fieldName={fieldName}
                        fieldPath={fieldPath}
                        getFieldValue={getFieldValue}
                        setFieldValue={setFieldValue}
                        token={token}
                    />
                );
            }
            return false;
        })
        .filter((a) => a);

    if (rows.length === 0) {
        return <></>;
    }

    return (
        <li key={`title_${title.id}_item_${item.id}`}>
            <h3>{getObjectDeepProperty(item, attrName)}</h3>
            <ul>{rows}</ul>
        </li>
    );
};

Block.propTypes = {
    title: PropTypes.shape({
        id: PropTypes.string,
    }),
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
        }),
    ),
    item: PropTypes.object,
    groupField: PropTypes.string,
    attrName: PropTypes.string,
    editItem: PropTypes.func,
    fieldPath: PropTypes.string,
    fieldName: PropTypes.string,
    getFieldValue: PropTypes.func,
    setFieldValue: PropTypes.func,
    token: PropTypes.string.isRequired,
};

export default Block;
