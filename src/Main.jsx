import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SiteClient } from 'datocms-client';
import interact from 'interactjs';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';

import connectToDatoCms from './connectToDatoCms';
import './style.css';

function getObjectDeepProperty(obj, path) {
  const parts = path.split('.');
  let val = obj;
  parts.forEach((p) => {
    val = val[p];
  });
  return val;
}

@connectToDatoCms(plugin => ({
  developmentMode: plugin.parameters.global.developmentMode,
  token: plugin.parameters.global.datoCmsApiToken,
  groupField: plugin.parameters.instance.groupField,
  allItemsQuery: plugin.parameters.instance.allItemsQuery,
  queryPart: plugin.parameters.instance.queryPart,
  attrName: plugin.parameters.instance.attrName,
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
    groupField: PropTypes.string,
    allItemsQuery: PropTypes.string,
    queryPart: PropTypes.string,
    attrName: PropTypes.string,
    itemId: PropTypes.string,
    itemType: PropTypes.string,
    token: PropTypes.string,
    // createNewItem: PropTypes.func,
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
    role: null,
    staff: null,
    artist: null,
    from: null,
    to: null,
  };

  componentDidMount() {
    this.updateData();
  }

  updateData(cache, item) {
    const {
      token,
      itemId,
      itemType,
      fieldName,
      groupField,
      allItemsQuery,
      queryPart,
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
        ${queryPart}
      }
    }
    ${fieldName} {
      id
      ${groupField} {
        id
      }
      artist {
        id
        firstName
        name
      }
      dateFrom
      dateTo
      ${groupField === 'role' ? 'highlighted' : ''}
    }
  }
}`,
        }),
      })
        .then(res => res.json())
        .then((res) => {
          this.setState({
            loading: false,
            data: res.data[itemType],
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
  ${allItemsQuery}(filter: {id: {eq: "${item.id}"}}) {
    id
    artist {
      firstName
      name
    }
  }
}`,
        }),
      })
        .then(res => res.json())
        .then((res) => {
          const { artist } = res.data[allItemsQuery][0];
          const newRecord = {
            id: item.id,
            [groupField]: {
              id: item[groupField],
            },
            artist: {
              id: item.artist,
              name: artist.firstName ? `${artist.firstName} ${artist.name}` : artist.name,
            },
            dateFrom: item.dateFrom,
            dateTo: item.dateTo,
            highlighted: false,
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

  renderBlock(title, items, item) {
    const { groupField, attrName } = this.props;

    const rows = items
      .map((i) => {
        if (i[groupField].id === item.id) {
          return this.renderRow(i);
        }
        return false;
      })
      .filter(a => a);

    if (rows.length === 0) {
      return <></>;
    }

    return (
      <li key={`title_${title.id}_item_${item.id}`}>
        <h3>{getObjectDeepProperty(item, attrName)}</h3>
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

    const index = data[fieldName].map(e => e.id).indexOf(item.id);

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
      <div key={`Row_${item.id}`}>
        <div
          className="dropzone"
          key={`dropzone_${index}`}
          id={`dropzone_${index}`}
        />
        <li className="draggable" key={`item_${item.id}`} id={`item_${index}`}>
          <i className="icon--hamburger" />
          {' '}
          {item.highlighted ? '!!! ' : ''}
          {item.artist.firstName}
          {' '}
          {item.artist.name}
          {renderDates()}
          {' '}
          <button
            type="button"
            className="DatoCMS-button DatoCMS-button--micro DatoCMS-button--white"
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
            className="DatoCMS-button DatoCMS-button--micro DatoCMS-button--white"
            onClick={() => {
              const currentFieldValue = getFieldValue(fieldPath);
              currentFieldValue.splice(
                getFieldValue(fieldPath).indexOf(item.id),
                1,
              );

              const indexInData = data[fieldName]
                .map(e => e.id)
                .indexOf(item.id);
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
  }

  render() {
    const {
      data, loading, role, staff, artist, from, to,
    } = this.state;
    const {
      fieldPath,
      fieldName,
      getFieldValue,
      setFieldValue,
      token,
      groupField,
      // itemId,
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
              if (artist && (groupField === 'role' ? role : staff)) {
                const roleAddition = groupField === 'role' ? { highlighted: false } : {};
                fetch('https://nd-test.symbio.now.sh/api/createItem', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                  },
                  body: JSON.stringify({
                    itemType: remoteItemsType,
                    production: null,
                    [groupField]: groupField === 'role' ? role.value : staff.value,
                    artist: artist.value,
                    dateFrom: from,
                    dateTo: to,
                    cmsId: null,
                    ...roleAddition,
                  }),
                })
                  .then(result => result.json())
                  .then((item) => {
                    const fieldValues = getFieldValue(fieldPath);
                    fieldValues.push(item.id);
                    setFieldValue(fieldPath, fieldValues);
                    this.updateData(true, item);
                  });
              }
            }}
          >
            <svg viewBox="0 0 448 512" width="1em" height="1em">
              <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
            </svg>
            <span>Přidat</span>
          </button>
          {(!artist || (groupField === 'role' && !role) || (groupField === 'staff' && !staff))
          && <span style={{ color: 'red', fontSize: 12 }}>Pro přidání obsazení zvolte roli a umělce a klikněte na tlačítko Přidat</span>}
        </div>
        <div className="form">
          <Select
            options={data.titles.map(title => ({
              label: title.title,
              options: title[fieldName].map(titleItem => ({
                value: titleItem.id,
                label: fieldName === 'roles' ? titleItem.name : titleItem.field.title,
              })),
            }))}
            placeholder={fieldName === 'roles' ? 'Vyberte roli...' : 'Vyberte funkci...'}
            styles={{
              control: (_, { selectProps: { width } }) => ({
                width,
                display: 'flex',
                borderTop: 'solid 1px',
                borderRight: 'solid 1px',
                borderBottom: 'solid 1px',
                padding: '3px',
              }),
              menu: (provided, state) => ({
                ...provided,
                width: state.selectProps.width,
              }),
            }}
            onChange={(val) => {
              if (fieldName === 'roles') {
                this.setState({
                  role: val,
                });
              } else {
                this.setState({
                  staff: val,
                });
              }
            }}
            width={180}
          />
          <AsyncSelect
            cacheOptions
            loadOptions={inputValue => fetch('https://graphql.datocms.com/preview', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                query: `{
                  allArtists(filter: {displayTitle: {matches: { pattern: "${inputValue}", caseSensitive: false}}}) {
                    value: id
                    label: displayTitle
                  }
                }`,
              }),
            })
              .then(res => res.json()).then(res => res.data.allArtists)}
            defaultOptions
            placeholder="Vyberte umělce..."
            onChange={(val) => {
              this.setState({
                artist: val,
              });
            }}
            styles={{
              control: (_, { selectProps: { width } }) => ({
                width,
                display: 'flex',
                borderTop: 'solid 1px',
                borderRight: 'solid 1px',
                borderBottom: 'solid 1px',
                padding: '3px',
              }),
              menu: (provided, state) => ({
                ...provided,
                width: state.selectProps.width,
              }),
            }}
            width={180}
          />
          <input
            type="date"
            onChange={(e) => {
              this.setState({
                from: e.target.value,
              });
            }}
          />
          <input
            type="date"
            onChange={(e) => {
              this.setState({
                to: e.target.value,
              });
            }}
          />
        </div>
        <ul>
          {data.titles.map(title => (
            <li key={`title_${title.id}`}>
              <h2>
                Titul:
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
