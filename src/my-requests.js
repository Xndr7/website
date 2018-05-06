import preact from 'preact';
import { IntlProvider, Text, MarkupText } from 'preact-i18n';
import t from 'i18n';
import localforage from 'localforage';

class RequestList extends preact.Component {
    constructor(props) {
        super(props);
        this.state = { requests: {} };

        // TODO: Is there a better place for this?
        localforage.config({
            'name': 'Datenanfragen.de', // TODO: Use the actual domain here?
            'storeName': 'my-requests'
        });
        let requests = {};
        localforage.iterate((data, reference) => { requests[reference] = data; })
            .then(() => { this.setState({ requests: requests }); })
            .catch(() => { console.log('Could not get requests.'); /* TODO: Proper error handling. */ });

        this.clearRequests = this.clearRequests.bind(this);
        this.buildCsv = this.buildCsv.bind(this);
    }

    render() {
        let request_rows = [];
        Object.keys(this.state.requests).forEach((reference) => {
            let request = this.state.requests[reference];
            if(!request) return;
            let recipient = request.recipient.split('\n', 1)[0];
            request_rows.push(<tr><td>{request.date}</td><td>{request.slug ? <a href={BASE_URL + 'company/' + request.slug}>{recipient}</a> : recipient}</td><td>{reference}</td><td>{t(request.type, 'my-requests')}</td><td>{t(request.via, 'my-requests')}</td></tr>);
        });

        let download_filename = (new URL(BASE_URL)).hostname.replace('www.', '') + '_export_' + (new Date()).toISOString().substring(0, 10) + '.csv';

        return (
            <IntlProvider scope="my-requests" definition={I18N_DEFINITION}>
                <main>
                    <h1><Text id="title" /></h1>
                    <p><MarkupText id="explanation" /></p>
                    <p><MarkupText id="explanation-saving" /></p>
                    <table className='table'>
                        <thead><th><Text id="date" /></th><th><Text id="recipient" /></th><th><Text id="reference" /></th><th><Text id="type" /></th><th><Text id="via" /></th></thead>
                        <tbody>{request_rows}</tbody>
                    </table>
                    { /* TODO: Style differently once we have a design. */ }
                    <button id="clear-button" onClick={this.clearRequests} style="float: right;"><Text id="delete-all-btn" /></button>
                    <a id="download-button" className="button" href={URL.createObjectURL(this.buildCsv())} download={download_filename} style="float: right; margin-right: 10px;"><Text id="export-btn" /></a>
                    <div className='clearfix' />
                </main>
            </IntlProvider>
        );
    }

    buildCsv() {
        let csv = 'date;slug;recipient;reference;type;via\r\n';
        Object.keys(this.state.requests).forEach((reference) => {
            let request = this.state.requests[reference];
            csv += [ request.date, request.slug, request.recipient.replace(/[\r\n]+/g, ', '), reference, request.type, request.via ].join(';') + '\r\n';
        });

        return new Blob([csv], { type: 'text/csv;charset=utf-8' });
    }

    clearRequests() {
        if(window.confirm(t('delete-all-confirm', 'my-requests'))) {
            localforage.clear()
                .then(() => { this.setState({ requests: {} }); })
                .catch((err) => { console.log('Could not clear requests: ' + err); /* TODO: Proper error handling. */});
        }
    }
}

preact.render((<RequestList/>), null, document.getElementById('my-requests'));