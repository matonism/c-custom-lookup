import clickableCellMarkup from './clickableCellMarkup.html';
import LightningDatatable from 'lightning/datatable';

export default class CustomLookupModalDataTable extends LightningDatatable {
    static customTypes = {
        clickableCell : {
            template: clickableCellMarkup,
            typeAttributes: ['recordId', 'value', 'isClickable']
        }
    }
}