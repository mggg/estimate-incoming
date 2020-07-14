import React from 'react';

const d3 = require("d3");

export default class FileInput extends React.Component {
  constructor(props) {
    super(props)

    document.body.ondragover = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
    };
    document.body.ondrop = this.handleDrop.bind(this);
  }

  handleDrop(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.startLoading();

    if (ev.dataTransfer.items && ev.dataTransfer.items.length) {
      this.parseFile(ev.dataTransfer.items[0].getAsFile());
    } else if (ev.dataTransfer.files && ev.dataTransfer.files.length) {
      this.parseFile(ev.dataTransfer.files[0].getAsFile());
    }
  }

  handleUpload(e) {
    this.props.startLoading();
    this.parseFile(e.target.files[0]);
  }

  parseFile(file) {
    let reader = new FileReader();
    reader.onload = (e) => {
        let tblob = e.target.result,
            rows = d3.csvParseRows(tblob);
        // trim header
        if (rows[0][0].toLowerCase().trim() === 'state' && rows[0][1].toLowerCase().trim() === 'students') {
          rows.splice(0, 1);
        }
        this.props.onChange(rows);
    };
    reader.readAsText(file);
  }

  render() {
    return <div>
      <input
        type="file"
        onChange={this.handleUpload.bind(this)}
      />
    </div>
  }
}
