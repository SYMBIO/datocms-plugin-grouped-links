import React, { Component } from 'react';
import PropTypes from 'prop-types';

import connectToDatoCms from './connectToDatoCms';
import './style.css';

@connectToDatoCms(plugin => ({
  developmentMode: plugin.parameters.global.developmentMode,
  token: plugin.parameters.global.datoCmsApiToken,
  itemId: plugin.itemId,
  createNewItem: plugin.createNewItem,
  editItem: plugin.editItem,
}))
export default class Main extends Component {
  static propTypes = {
    itemId: PropTypes.string,
    token: PropTypes.string,
    createNewItem: PropTypes.func,
    editItem: PropTypes.func,
  };

  state = {
    loading: true,
    data: {},
  };

  componentDidMount() {
    this.updateData();
  }

  getProductionRoleRow(prodRole) {
    const { editItem } = this.props;

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
      <li key={`prodRole_${prodRole.id}`}>
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
            editItem(prodRole.id).then((item) => {
              if (item) {
                this.updateData();
              }
            });
          }}
        >
          <span>Odstranit</span>
        </button>
      </li>
    );
  }

  updateData() {
    const { token, itemId } = this.props;

    this.setState({
      loading: true,
    });

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
      position
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
      })
      .catch((error) => {
        this.setState({
          loading: false,
        });
        console.log(error);
      });
  }

  render() {
    const { data, loading } = this.state;
    const { createNewItem } = this.props;

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
                this.updateData();
              }
            });
          }}
        >
          <svg viewBox="0 0 448 512" width="1em" height="1em">
            <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
          </svg>
          <span>Přidat</span>
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
