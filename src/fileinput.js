import React from 'react';

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

    if (ev.dataTransfer.items && ev.dataTransfer.items.length) {
      this.parseFile(ev.dataTransfer.items[0].getAsFile());
    } else if (ev.dataTransfer.files && ev.dataTransfer.files.length) {
      this.parseFile(ev.dataTransfer.files[0].getAsFile());
    }
  }

  handleUpload(e) {
    this.parseFile(e.target.files[0]);
  }

  parseFile(file) {
    let reader = new FileReader();
    reader.onload = (e) => {
        let tblob = e.target.result,
            rows = tblob.trim().split(/\r\n|\r|\n/)
        this.props.onChange(rows)
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
