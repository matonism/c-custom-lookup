import { LightningElement, api} from 'lwc';

export default class Paginator extends LightningElement {
    @api pageNumber;
    @api pageSize;
    @api totalItemCount;
    
    handlePrevious(){
        this.dispatchEvent(new CustomEvent('previous'));
    }

    handleNext(){
        this.dispatchEvent(new CustomEvent('next'));
    }

    handleFirstPage(){
        this.dispatchEvent(new CustomEvent('first'));
    }
    
    handleLastPage(){
        this.dispatchEvent(new CustomEvent('last'));
    }

    get currentPageNumber() {
        return this.totalItemCount === 0 ? 0 : this.pageNumber;
    }

    get isFirstPage() {
        return this.pageNumber === 1;
    }

    get isLastPage() {
        return this.pageNumber >= this.totalPages;
    }

    get totalPages() {
        return Math.ceil(this.totalItemCount / this.pageSize);
    }


}