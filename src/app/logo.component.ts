import {Component} from "@angular/core";

@Component({
    selector: 'wave-vat-logo',
    template: `
    <h1><span class="blue">V</span
        ><span class="light-blue">A</span
        ><span class="green">T</span
    ></h1>
    `,
    styles: [`
    h1 {
        background: #fff;
        height: 3rem;
        padding: 0.5rem;
        border-radius: 3px;
        margin: calc((82px - 4rem) / 2) auto;
    }
    .blue {
        color: #3258a1;
    }
    .light-blue {
        color: #3cace4;
    }
    .green {
        color: #8cb74c;
    }
    `],
})
export class VatLogoComponent {}

@Component({
    selector: 'wave-idessa-logo',
    template: `
    <h1>
        <img src="assets/logo_idessa.png">
        <span>IDESSA</span>
    </h1>
    `,
    styles: [`
    h1 {
        opacity: 1;
        font-size: 34px;
    }
    img {
        vertical-align: middle;
        height: 41px;
    }
    span {
        opacity: 0.5;
    }
    `],
})
export class IdessaLogoComponent {}