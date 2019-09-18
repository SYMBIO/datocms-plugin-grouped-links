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
  createNewItem: plugin.createNewItem,
  editItem: plugin.editItem,
  fieldPath: plugin.fieldPath,
  setFieldValue: plugin.setFieldValue,
  getFieldValue: plugin.getFieldValue,
}))
export default class Main extends Component {
  static propTypes = {
    itemId: PropTypes.string,
    token: PropTypes.string,
    createNewItem: PropTypes.func,
    editItem: PropTypes.func,
    fieldPath: PropTypes.string,
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

  getProductionRoleRow(prodRole) {
    const {
      editItem, fieldPath, getFieldValue, setFieldValue, token,
    } = this.props;
    const { data } = this.state;

    const index = data.roles.map(e => e.id).indexOf(prodRole.id);

    function renderDates() {
      if (!prodRole.dateFrom && !prodRole.dateTo) {
        return false;
      }

      const result = [' '];
      if (prodRole.dateFrom || prodRole.dateTo) {
        result.push('(');
      }
      if (prodRole.dateFrom) {
        result.push('od: ');
        result.push(prodRole.dateFrom);
      }
      if (prodRole.dateTo) {
        if (prodRole.dateFrom) {
          result.push(', ');
        }
        result.push('do: ');
        result.push(prodRole.dateTo);
      }
      if (prodRole.dateFrom || prodRole.dateTo) {
        result.push(')');
      }
      return result.join('');
    }

    return (
      <div>
        <div className="dropzone" key={`dropzone_${index}`} id={`dropzone_${index}`} />
        <li className="draggable" key={`prodRole_${prodRole.id}`} id={`prodRole_${index}`}>
          {prodRole.artist.name}
          {renderDates()}
          {' '}
          <button
            type="button"
            className="DatoCMS-button DatoCMS-button--micro"
            onClick={() => {
              editItem(prodRole.id).then((item) => {
                if (item) {
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
              currentFieldValue.splice(getFieldValue(fieldPath).indexOf(prodRole.id), 1);

              const indexInData = data.roles.map(e => e.id).indexOf(prodRole.id);
              data.roles.splice(indexInData, 1);

              setFieldValue(fieldPath, currentFieldValue);

              const datoClient = new SiteClient(token);
              datoClient.items.destroy(prodRole.id)
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

  updateData(cache, item) {
    const { token, itemId } = this.props;
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
  production(filter: {id: {eq: "${itemId}"}}) {
    titles {
      id
      title
      roles {
        id
        title
      }
    }
    roles {
      id
      role {
        id
      }
      artist {
        id
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
            allProductionRoles(filter: {id: {eq: "${item.id}"}}) {
              id
              artist {
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
            role: {
              id: item.attributes.role,
            },
            artist: {
              id: item.attributes.artist,
              name: res.data.allProductionRoles[0].artist.name,
            },
            dateFrom: item.attributes.date_from,
            dateTo: item.attributes.date_to,
          };

          const originalData = data;
          originalData.roles.push(newRecord);

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
    const position = { x: 0, y: 0 };
    const { getFieldValue, setFieldValue, fieldPath } = this.props;
    const { data } = this.state;

    interact('.dropzone').dropzone({
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
        const draggableArrayIndex = Number(event.relatedTarget.id.split('_')[1]);

        const removedValue = currentFieldValue.splice(
          dropzoneArrayIndex,
          1,
          currentFieldValue[draggableArrayIndex],
        );
        currentFieldValue.splice(draggableArrayIndex, 1, removedValue[0]);

        const removedLi = data.roles.splice(dropzoneArrayIndex, 1, data.roles[draggableArrayIndex]);
        data.roles.splice(draggableArrayIndex, 1, removedLi[0]);

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

    interact('.draggable').draggable({
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

  render() {
    const { data, loading } = this.state;
    const {
      createNewItem, fieldPath, getFieldValue, setFieldValue,
    } = this.props;

    if (loading) {
      return <div className="container">Načítám data...</div>;
    }

    return (
      <div className="container">
        <button
          type="button"
          className="DatoCMS-button"
          onClick={() => {
            createNewItem(137159).then((item) => {
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
            <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
          </svg>
          <span>Přidat nový</span>
        </button>
        <ul>
          {data.titles.map(title => (
            <li key={`title_${title.id}`}>
              <h2>{title.title}</h2>
              <ul>
                {title.roles.map(role => (
                  <li key={`title_${title.id}_role_${role.id}`}>
                    <h3>{role.title}</h3>
                    <ul>
                      {data.roles.map((prodRole) => {
                        if (prodRole.role.id === role.id) {
                          return this.getProductionRoleRow(prodRole);
                        }
                        return false;
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
