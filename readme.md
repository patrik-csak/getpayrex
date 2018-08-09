# `getpayrex`

`getpayrex` is a Node.js command line tool for downloading paychecks as PDFs
from Intuit’s Paycheck Records ([`paycheckrecords.com`](https://www.paycheckrecords.com/)).

## Setup

Install `getpayrex`:

```
$ npm install --global getpayrex
```

Or use [`npx`](https://www.npmjs.com/package/npx) to run `getpayrex` without 
installing:

```
$ npx getpayrex [options] <user-id>
```

## Usage

```
$ [npx] getpayrex [options] <user-id>
```

### Arguments

`getpayrex` requires one argument: your Paycheck Records user ID.

### Options

`getpayrex` accepts the following options:

| Option | Description | Default |
|---|---|---|
| `-d, --destination <directory>` | The directory where the PDFs should be saved. | `~/Downloads` |
| `-s, --start-date <yyyy-mm-dd>` | The start of the range for which to download records. | `1900-01-01` |
| `-e, --end-date <yyyy-mm-dd>` | The end of the range for which to download records. | Today |
