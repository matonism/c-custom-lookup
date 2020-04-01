import { LightningElement, api } from 'lwc';

export default class CustomLookupResult extends LightningElement {
    @api icon;
    @api record;

    selectRecord(event){
        const selectEvent = new CustomEvent('customlookupselect', { detail: this.record });
        this.dispatchEvent(selectEvent);
    }
}