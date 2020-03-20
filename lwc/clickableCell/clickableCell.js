import { LightningElement, api } from 'lwc';

export default class ClickableCell extends LightningElement {
    @api recordId;
    @api value;
    @api isClickable = false;

    handleClickableCellClick(event){
        event.preventDefault();

        let selectionEvent = new CustomEvent('recordidselection', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {recordId : this.recordId}
        });

        this.dispatchEvent(selectionEvent);


    }


}