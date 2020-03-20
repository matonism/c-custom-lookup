import { LightningElement, api } from 'lwc';

export default class CustomLookupResult extends LightningElement {
    @api icon;
    @api record;

    selectRecord(event){
        event.preventDefault();

        const selectEvent = new CustomEvent('recordselect', {
            detail: this.record 
        });

        this.dispatchEvent(selectEvent);
    }
}