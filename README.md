# Texthooker UI

A web interface for consuming [Textractor](https://github.com/Artikash/Textractor) with a websocket plugin like [textractor-websocket](https://github.com/sadolit/textractor-websocket) or [TextractorSender](https://github.com/KamWithK/TextractorSender).

An online version of the page can be accessed [here](https://renji-xd.github.io/texthooker-ui/).

An offline version of the page can be downloaded from the [docs](https://raw.githubusercontent.com/Renji-XD/texthooker-ui/main/docs/index.html) folder or build locally by your own.

## Building

```
# Install pnpm
npm install --global pnpm

# Install dependencies
pnpm install

# Build the Page
pnpm run build
```

The page can be opened via the index.html inside the "docs" folder and is usable without the need of hosting it via a server.

## FAQ

### I can't connect to the websocket with textractor-websocket.

-   This plugin requires that textractor captures at least one line before starting the server - connect manually afterwards

### I can't connect to the websocket with TextractorSender.

-   Make sure you are using the right port which is 9001

### I can't connect to the websocket with a different plugin/still can't connect to the websocket with one of the mentioned plugins.

-   Make sure your firewall is not blocking the required ports. You can also check if another extension is interfering by trying out the page with a clean temporary profile and disabled extensions

### Can I use this page with extensions like "Clipboard Inserter" or "lap-clipboard-inserter"?

-   When "Enable external Clipboard Monitor" is checked text appended as paragraph to the page body will be taken over by the app. Make sure to enable this setting before the actual extension to avoid wrongly pasted elements

### How do I customize the page with CSS?

-   You can use normal CSS syntax and rules via the "Custom CSS" Field. The content will be appended as style node to the page header

### How can I delete lines?

There are multiple ways of deleting a line:

-   Click on the "Delete last Line" Icon in the header
-   Click on the "Reset Lines" / "Reset Data" / "Reset All" Icon in the settings menu
-   Highlight a line and press the "Delete" key on the keyboard
-   Select a Line for deletion by holding the "CTRL" key on the keyboard and double click on it (you can press "Escape" to unselect lines again). Afterwards click on the "Remove selected Lines" icon in the header

### How can I edit a Line?

-   You can modify the content of a line by double clicking on it. Clicking somewhere outside will exit the edit mode. Changes to the text will automatically be reflected in the character counter

### What is covered by "Undo last Action"?

_Note_: By default, the undo history is stored in memory only. If you want to keep it across tab reloads, make sure to enable the respective setting.

-   Deleting lines by clicking on the "Remove last line" icon
-   Deleting lines by highlighting them and pressing the "Delete" key on the keyboard
-   Deleting lines by clicking on the "Remove selected lines" icon
-   Editing content of a line

### What is NOT covered by "Undo last Action"?

-   Deleting data by clicking on the "Reset Lines" / "Reset Data" / "Reset All" icon
-   Overwritten data by an import

### Can I move the data to another device / browser?

-   You can export/import data by clicking on the respective Icon in the settings menu
-   Clicking on the icon will export the current time value, notes, displayed lines and action history (settings will not be exported)
-   Clicking on the icon while holding the "ALT" key on the keyboard lets you select a previously exported file for import. Note that all existing data will be overwritten

## Known Issues

-   High amount of displayed characters may slow down the page performance due to the current greedy way of counting characters etc.
-   The horizontal reading mode performs overall better than the vertical one
-   Line breaks added manually during editing a line are sometimes removed

## Acknowledgements

-   [Anacreon Texthooker](https://anacreondjt.gitlab.io/texthooker.html)
-   [MarvNC texthooker-websocket User Script](https://github.com/MarvNC/texthooker-websocket)
