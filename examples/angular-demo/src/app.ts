// app.ts: a product card whose data loads like a real fetch. While it loads, Veilo shows the
// skeleton on the card's own markup; when the data arrives, the reveal plays.

import { Component, computed, signal } from "@angular/core";
import { VeiloReveal, VeiloSkeletonDirective } from "@veilo-ui/angular";
import { fetchProduct, PLACEHOLDER, type Product } from "./product";

/** The demo page: the card, a seller avatar, a status line and a Reload button. */
@Component({
  selector: "app-root",
  imports: [VeiloReveal, VeiloSkeletonDirective],
  template: `
    <main>
      <h1>Veilo Angular demo</h1>
      <!-- The card renders the same markup for placeholder and real data, so the skeleton has the
           real sizes. data-veilo-slot marks the parts Veilo animates. -->
      <veilo-reveal
        class="card"
        [ready]="product() !== null"
        [preset]="'dot-upscale'"
        (complete)="status.set('Revealed')"
      >
        <img class="photo" data-veilo-slot="photo" [src]="shown().image" [alt]="shown().name" />
        <h2 data-veilo-slot="title">{{ shown().name }}</h2>
        <p data-veilo-slot="description">{{ shown().description }}</p>
        <p class="price" data-veilo-slot="price">{{ shown().price }}</p>
        <button type="button" data-veilo-slot="buy">
          <span data-veilo-slot="label">Add to cart</span>
        </button>
      </veilo-reveal>
      <p class="seller">
        <span
          class="avatar"
          aria-hidden="true"
          veiloSkeleton
          [loading]="product() === null"
          [self]="true"
          [effect]="'pulse'"
        ></span>
        Sold by Veilo Store
      </p>
      <p role="status" data-testid="status">{{ status() }}</p>
      <button type="button" (click)="load()">Reload</button>
    </main>
  `,
})
export class App {
  protected readonly product = signal<Product | null>(null);
  protected readonly status = signal("Loading");
  protected readonly shown = computed(() => this.product() ?? PLACEHOLDER);
  // Only the latest load may win when Reload is pressed quickly.
  private request = 0;

  constructor() {
    this.load();
  }

  /** Loads the product again: back to the skeleton, then the reveal when the data arrives. */
  protected load(): void {
    const id = ++this.request;
    this.product.set(null);
    this.status.set("Loading");
    void fetchProduct().then((data) => {
      if (id === this.request) this.product.set(data);
    });
  }
}
