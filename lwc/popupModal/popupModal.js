import { LightningElement, api, track } from 'lwc';

const HIDDEN_CSS_CLASS = 'modal-hidden';
const BASE_MODAL_CSS = 'slds-modal slds-fade-in-open';

export default class Modal extends LightningElement {
    @track showModal = false;
    @track hasHeaderString = false;

    modalClass = BASE_MODAL_CSS;
    __privateHeader;
    __privateSize;
    
    @api
    get size() {
        return this.__privateSize;
    }
    set size(value) {
        this.__privateSize = encodeURI(value);
        this.modalClass = BASE_MODAL_CSS + ' slds-modal_' + this.__privateSize;
    }

    @api
    get header() {
        return this.__privateHeader;
    }

    set header(value) {
        this.__privateHeader = value;
        this.hasHeaderString = value !== '';
    }


    @api show() {
        this.showModal = true;
    }

    @api hide() {
        this.showModal = false;
    }

    handleDialogClose() {
        //Let parent know that dialog is closed (mainly by that cross button) so it can set proper variables if needed
        const closedialog = new CustomEvent('closedialog');
        this.dispatchEvent(closedialog);
        this.hide();
    }

    handleSlotTaglineChange() {
        const taglineEl = this.template.querySelector('p');
        if(!!taglineEl){
            taglineEl.classList.remove(HIDDEN_CSS_CLASS);
        }
    }

    handleSlotFooterChange() {
        const footerEl = this.template.querySelector('footer');
        if(!!footerEl){
            footerEl.classList.remove(HIDDEN_CSS_CLASS);
        }
    }
}