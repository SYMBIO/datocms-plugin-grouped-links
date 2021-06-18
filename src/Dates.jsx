import React from 'react';
import PropTypes from 'prop-types';

const Dates = ({ item }) => {
    if (!item.dateFrom && !item.dateTo) {
        return false;
    }

    const result = [' '];
    if (item.dateFrom || item.dateTo) {
        result.push('(');
    }
    if (item.dateFrom) {
        result.push('od: ');
        result.push(item.dateFrom);
    }
    if (item.dateTo) {
        if (item.dateFrom) {
            result.push(', ');
        }
        result.push('do: ');
        result.push(item.dateTo);
    }
    if (item.dateFrom || item.dateTo) {
        result.push(')');
    }
    return result.join('');
}

Dates.propTypes = {
    item: PropTypes.shape({
        dateFrom: PropTypes.string,
        dateTo: PropTypes.string,
    })
};

export default Dates;
