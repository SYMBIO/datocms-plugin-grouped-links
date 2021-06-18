import React from 'react';
import PropTypes from 'prop-types';
import { SiteClient } from 'datocms-client';
import Dates from './Dates';

const Row = ({ item, editItem, fieldPath, fieldName, getFieldValue, setFieldValue, token }) => {
    const { data } = this.state;

    const index = data[fieldName].map((e) => e.id).indexOf(item.id);

    return (
        <div key={`Row_${item.id}`}>
            <div className="dropzone" key={`dropzone_${index}`} id={`dropzone_${index}`} />
            <li className="draggable" key={`item_${item.id}`} id={`item_${index}`}>
                <i className="icon--hamburger" /> {item.highlighted ? '!!! ' : ''}
                {item.artist.firstName} {item.artist.name}
                <Dates item={item} />{' '}
                <button
                    type="button"
                    className="DatoCMS-button DatoCMS-button--micro"
                    onClick={() => {
                        editItem(item.id).then((item2) => {
                            if (item2) {
                                this.updateData();
                            }
                        });
                    }}
                >
                    <span>Upravit</span>
                </button>
                <button
                    type="button"
                    className="DatoCMS-button DatoCMS-button--micro"
                    onClick={() => {
                        const currentFieldValue = getFieldValue(fieldPath);
                        currentFieldValue.splice(getFieldValue(fieldPath).indexOf(item.id), 1);

                        const indexInData = data[fieldName].map((e) => e.id).indexOf(item.id);
                        data[fieldName].splice(indexInData, 1);

                        setFieldValue(fieldPath, currentFieldValue);

                        const datoClient = new SiteClient(token);
                        datoClient.items.destroy(item.id).catch((error) => {
                            console.log(error);
                        });
                    }}
                >
                    <span>Odstranit</span>
                </button>
            </li>
        </div>
    );
};

Row.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.string,
        highlighted: PropTypes.bool,
        artist: PropTypes.shape({
            firstName: PropTypes.string,
            name: PropTypes.string.isRequired,
        }),
    }),
    editItem: PropTypes.func,
    fieldPath: PropTypes.string,
    fieldName: PropTypes.string,
    getFieldValue: PropTypes.func,
    setFieldValue: PropTypes.func,
    token: PropTypes.string.isRequired,
};

export default Row;
