import React, { Component } from 'react';
import { withRouter } from 'react-router';
import ReactTable from 'react-table';
import { connect } from 'react-redux';
import { capitalize } from 'lodash';
import { get } from 'lodash';
import 'react-table/react-table.css';
import { RetrieveMovesForOffice } from './api.js';
import Alert from 'shared/Alert';
import { formatDate, formatDateTime } from 'shared/formatters';

class QueueTable extends Component {
  constructor() {
    super();
    this.state = {
      data: [],
      pages: null,
      loading: true,
    };
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.queueType !== prevProps.queueType) {
      this.fetchData();
    }
  }

  static defaultProps = {
    moveLocator: '',
    firstName: '',
    lastName: '',
  };

  async fetchData() {
    const loadingQueueType = this.props.queueType;

    this.setState({
      data: [],
      pages: null,
      loading: true,
      loadingQueue: loadingQueueType,
    });

    // Catch any errors here and render an empty queue
    try {
      const body = await RetrieveMovesForOffice(this.props.queueType);

      // Only update the queue list if the request that is returning
      // is for the same queue as the most recent request.
      if (this.state.loadingQueue === loadingQueueType) {
        this.setState({
          data: body,
          pages: 1,
          loading: false,
        });
      }
    } catch (e) {
      this.setState({
        data: [],
        pages: 1,
        loading: false,
      });
    }
  }

  render() {
    const titles = {
      new: 'New Moves',
      troubleshooting: 'Troubleshooting',
      ppm: 'PPMs',
      hhg_accepted: 'Accepted HHGs',
      hhg_delivered: 'Delivered HHGs',
      hhg_completed: 'Completed HHGs',
      all: 'All Moves',
    };

    this.state.data.forEach(row => {
      if (row.ppm_status === 'PAYMENT_REQUESTED') {
        row.synthetic_status = row.ppm_status;
      } else {
        row.synthetic_status = row.status;
      }
    });

    return (
      <div>
        {this.props.showFlashMessage ? (
          <Alert type="success" heading="Success">
            {this.props.flashMessageLines.join('\n')}
            <br />
          </Alert>
        ) : null}
        <h1>Queue: {titles[this.props.queueType]}</h1>
        <div className="queue-table">
          <ReactTable
            columns={[
              {
                Header: 'Status',
                accessor: 'synthetic_status',
                Cell: row => <span className="status">{capitalize(row.value.replace('_', ' '))}</span>,
              },
              {
                Header: 'Locator #',
                accessor: 'locator',
              },
              {
                Header: 'Customer name',
                accessor: 'customer_name',
              },
              {
                Header: 'DoD ID',
                accessor: 'edipi',
              },
              {
                Header: 'Rank',
                accessor: 'rank',
              },
              {
                Header: 'Move date',
                accessor: 'move_date',
                Cell: row => <span className="move_date">{formatDate(row.value)}</span>,
              },
              {
                Header: 'Last modified',
                accessor: 'last_modified_date',
                Cell: row => <span className="updated_at">{formatDateTime(row.value)}</span>,
              },
            ]}
            data={this.state.data}
            loading={this.state.loading} // Display the loading overlay when we need it
            pageSize={this.state.data.length}
            className="-striped -highlight"
            showPagination={false}
            getTrProps={(state, rowInfo) => ({
              onDoubleClick: e => this.props.history.push(`new/moves/${rowInfo.original.id}`),
            })}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    showFlashMessage: get(state, 'flashMessages.display', false),
    flashMessageLines: get(state, 'flashMessages.messageLines', false),
  };
};

export default withRouter(connect(mapStateToProps)(QueueTable));
