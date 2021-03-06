import { parseCss } from './cssParser'
import state from './state'

export function parseHtml(
  input: HTMLTableElement | string,
  includeHiddenHtml = false,
  useCss = false
): { head: any[][]; body: any[][]; foot: any[][] } {
  let tableElement: HTMLTableElement
  if (typeof input === 'string') {
    tableElement = <HTMLTableElement>window.document.querySelector(input)
  } else {
    tableElement = input
  }

  const head: any[] = [],
    body: any[] = [],
    foot: any[] = []

  if (!tableElement) {
    console.error('Html table could not be found with input: ', input)
    return { head, body, foot }
  }

  for (const rowNode of tableElement.rows as any) {
    const tagName = rowNode.parentNode.tagName.toLowerCase()
    let row = parseRowContent(window, rowNode, includeHiddenHtml, useCss)
    if (!row) continue

    if (tagName === 'thead') {
      head.push(row)
    } else if (tagName === 'tfoot') {
      foot.push(row)
    } else {
      // Add to body both if parent is tbody or table
      // (not contained in any section)
      body.push(row)
    }
  }
  return { head, body, foot }
}

function parseRowContent(
  window: Window,
  row: HTMLTableRowElement,
  includeHidden: boolean,
  useCss: boolean
) {
  let resultRow: any = []
  let rowStyles = useCss
    ? parseCss(row, state().scaleFactor(), [
        'cellPadding',
        'lineWidth',
        'lineColor',
      ])
    : {}
  for (let i = 0; i < row.cells.length; i++) {
    let cell = row.cells[i]
    let style = window.getComputedStyle(cell)
    if (includeHidden || style.display !== 'none') {
      let cellStyles = useCss ? parseCss(cell, state().scaleFactor()) : {}
      resultRow.push({
        rowSpan: cell.rowSpan,
        colSpan: cell.colSpan,
        styles: useCss ? cellStyles : null,
        _element: cell, // For hooks
        content: parseCellContent(cell),
      })
    }
  }
  if (resultRow.length > 0 && (includeHidden || rowStyles.display !== 'none')) {
    resultRow._element = row
    return resultRow
  }
}

function parseCellContent(orgCell: any) {
  // Work on cloned node to make sure no changes are applied to html table
  const cell = orgCell.cloneNode(true)

  // Remove extra space and line breaks in markup to make it more similar to
  // what would be shown in html
  cell.innerHTML = cell.innerHTML.replace(/\n/g, '').replace(/ +/g, ' ')

  // Preserve <br> tags as line breaks in the pdf
  cell.innerHTML = cell.innerHTML
    .split('<br>')
    .map((part: string) => part.trim())
    .join('\n')

  // innerText for ie
  return cell.innerText || cell.textContent || ''
}
