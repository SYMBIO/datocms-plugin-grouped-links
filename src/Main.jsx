import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SiteClient } from 'datocms-client';
import interact from 'interactjs';

import connectToDatoCms from './connectToDatoCms';
import './style.css';

@connectToDatoCms(plugin => ({
  developmentMode: plugin.parameters.global.developmentMode,
  token: plugin.parameters.global.datoCmsApiToken,
  itemId: plugin.itemId,
  itemType: plugin.itemType.attributes.api_key,
  createNewItem: plugin.createNewItem,
  editItem: plugin.editItem,
  fieldName: plugin.field.attributes.api_key,
  fieldPath: plugin.fieldPath,
  remoteItemsType:
    plugin.field.attributes.validators.items_item_type.item_types[0],
  setFieldValue: plugin.setFieldValue,
  getFieldValue: plugin.getFieldValue,
}))
export default class Main extends Component {
  static propTypes = {
    itemId: PropTypes.string,
    itemType: PropTypes.string,
    token: PropTypes.string,
    createNewItem: PropTypes.func,
    editItem: PropTypes.func,
    fieldName: PropTypes.string,
    fieldPath: PropTypes.string,
    remoteItemsType: PropTypes.string,
    setFieldValue: PropTypes.func,
    getFieldValue: PropTypes.func,
  };

  state = {
    loading: true,
    data: {},
  };

  componentDidMount() {
    this.updateData();
  }

  updateData(cache, item) {
    const {
      token, itemId, itemType, fieldName,
    } = this.props;
    const { data } = this.state;

    this.setState({
      loading: true,
    });

    if (!cache) {
      fetch('https://graphql.datocms.com/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `{
            ${itemType}(filter: {id: {eq: "${itemId}"}}) {
              titles {
                id
                title
                ${fieldName} {
                  id
                  field {
                    id
                    title
                  }
                }
              }
              ${fieldName} {
                id
                staff {
                  id
                }
                artist {
                  id
                  firstName
                  name
                }
                dateFrom
                dateTo
              }
            }
          }`,
        }),
      })
        .then(res => res.json())
        .then((res) => {
          this.setState({
            loading: false,
            data: res.data.production,
          });

          this.initilizeDragHandler();
        })
        .catch((error) => {
          this.setState({
            loading: false,
          });
          console.log(error);
        });
    } else {
      fetch('https://graphql.datocms.com/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `{
            allProductionStaffs(filter: {id: {eq: "${item.id}"}}) {
              id
              artist {
                first_name
                name
              }
            }
          }
          `,
        }),
      })
        .then(res => res.json())
        .then((res) => {
          const newRecord = {
            id: item.id,
            staff: {
              id: item.attributes.staff,
            },
            artist: {
              id: item.attributes.artist,
              name: res.data.allProductionStaffs[0].artist.name,
            },
            dateFrom: item.attributes.date_from,
            dateTo: item.attributes.date_to,
          };

          const originalData = data;
          originalData[fieldName].push(newRecord);

          this.setState({
            loading: false,
            data: originalData,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  initilizeDragHandler() {
    const position = {
      x: 0,
      y: 0,
    };
    const {
      getFieldValue, setFieldValue, fieldPath, fieldName,
    } = this.props;
    const { data } = this.state;

    interact('.dropzone')
      .dropzone({
        overlap: 0.05,

        ondropactivate(event) {
          event.target.classList.toggle('drop-active');
        },
        ondragenter(event) {
          event.relatedTarget.classList.toggle('can-drop');
        },
        ondragleave(event) {
          event.relatedTarget.classList.toggle('can-drop');
        },
        ondrop(event) {
          const currentFieldValue = getFieldValue(fieldPath);
          const dropzoneArrayIndex = Number(event.target.id.split('_')[1]);
          const draggableArrayIndex = Number(
            event.relatedTarget.id.split('_')[1],
          );

          const removedValue = currentFieldValue.splice(
            dropzoneArrayIndex,
            1,
            currentFieldValue[draggableArrayIndex],
          );
          currentFieldValue.splice(draggableArrayIndex, 1, removedValue[0]);

          const removedLi = data[fieldName].splice(
            dropzoneArrayIndex,
            1,
            data[fieldName][draggableArrayIndex],
          );
          data[fieldName].splice(draggableArrayIndex, 1, removedLi[0]);

          event.relatedTarget.classList.toggle('can-drop');
          setFieldValue(fieldPath, currentFieldValue);
        },
        ondropdeactivate(event) {
          const e = event;
          e.target.classList.toggle('drop-active');
          e.relatedTarget.style.transform = `translate(0px, -${position.y}px)`;
          position.y = 0;
        },
      });

    interact('.draggable')
      .draggable({
        modifiers: [
          interact.modifiers.restrict({
            restriction: 'ul li ul li ul',
            endOnly: false,
          }),
        ],
        startAxis: 'y',
        lockAxis: 'y',
        listeners: {
          move(event) {
            const draggableElement = event.target;

            position.x += event.dx;
            position.y += event.dy;

            draggableElement.style.transform = `translate(${position.x}px, ${position.y}px)`;
          },
        },
      });
  }

  renderBlock(title, items, item) {
    const rows = items.map((i) => {
      if (i.staff.id === item.id) {
        return this.renderRow(i);
      }
      return false;
    }).filter(a => a);

    if (rows.length === 0) {
      return <></>;
    }

    return (
      <li key={`title_${title.id}_item_${item.id}`}>
        <h3>{item.field.title}</h3>
        <ul>{rows}</ul>
      </li>
    );
  }

  renderRow(item) {
    const {
      editItem,
      fieldPath,
      fieldName,
      getFieldValue,
      setFieldValue,
      token,
    } = this.props;
    const { data } = this.state;

    const index = data[fieldName].map(e => e.id)
      .indexOf(item.id);

    function renderDates() {
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

    return (
      <div>
        <div
          className="dropzone"
          key={`dropzone_${index}`}
          id={`dropzone_${index}`}
        />
        <li
          className="draggable"
          key={`item_${item.id}`}
          id={`item_${index}`}
        >
          <i className="icon--hamburger" />
          {' '}
          {item.artist.firstName}
          {' '}
          {item.artist.name}
          {renderDates()}
          {' '}
          <button
            type="button"
            className="DatoCMS-button DatoCMS-button--micro"
            onClick={() => {
              editItem(item.id)
                .then((item2) => {
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
              currentFieldValue.splice(
                getFieldValue(fieldPath)
                  .indexOf(item.id),
                1,
              );

              const indexInData = data[fieldName]
                .map(e => e.id)
                .indexOf(item.id);
              data[fieldName].splice(indexInData, 1);

              setFieldValue(fieldPath, currentFieldValue);

              const datoClient = new SiteClient(token);
              datoClient.items.destroy(item.id)
                .catch((error) => {
                  console.log(error);
                });
            }}
          >
            <span>Odstranit</span>
          </button>
        </li>
      </div>
    );
  }

  render() {
    const { data, loading } = this.state;
    const {
      createNewItem,
      fieldPath,
      fieldName,
      getFieldValue,
      setFieldValue,
      remoteItemsType,
    } = this.props;

    if (loading) {
      return <div className="container">Načítám data...</div>;
    }

    return (
      <div className="container">
        <div className="toolbar">
          <button
            type="button"
            className="DatoCMS-button"
            onClick={() => {
              createNewItem(remoteItemsType)
                .then((item) => {
                  if (item) {
                    const fieldValues = getFieldValue(fieldPath);
                    fieldValues.push(item.id);
                    setFieldValue(fieldPath, fieldValues);
                    this.updateData(true, item);
                  }
                });
            }}
          >
            <svg viewBox="0 0 448 512" width="1em" height="1em">
              <path
                d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"
              />
            </svg>
            <span>Přidat</span>
          </button>
        </div>
        <ul>
          {data.titles.map(title => (
            <li key={`title_${title.id}`}>
              <h2>
                Titul:
                {' '}
                {title.title}
              </h2>
              <ul>
                {title[fieldName].map(item => this.renderBlock(title, data[fieldName], item))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
