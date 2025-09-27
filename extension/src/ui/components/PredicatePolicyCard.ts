// PredicatePolicyCard Component
// Reusable component for configuring individual predicate policies

export interface PredicateConfig {
    type: 'subscription' | 'delivery' | 'purchase' | 'financial';
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
    price: number;
    minPrice: number;
    maxPrice: number;
    typicalRange: string;
}

export interface PredicatePolicyCardProps {
    config: PredicateConfig;
    onToggle: (type: string, enabled: boolean) => void;
    onPriceChange: (type: string, price: number) => void;
    disabled?: boolean;
}

export class PredicatePolicyCard {
    private element: HTMLElement;
    private config: PredicateConfig;
    private onToggle: (type: string, enabled: boolean) => void;
    private onPriceChange: (type: string, price: number) => void;
    private disabled: boolean;

    constructor(
        container: HTMLElement,
        config: PredicateConfig,
        onToggle: (type: string, enabled: boolean) => void,
        onPriceChange: (type: string, price: number) => void,
        disabled: boolean = false
    ) {
        this.config = config;
        this.onToggle = onToggle;
        this.onPriceChange = onPriceChange;
        this.disabled = disabled;

        this.element = this.createCardElement();
        container.appendChild(this.element);
        this.bindEvents();
    }

    private createCardElement(): HTMLElement {
        const card = document.createElement('div');
        card.className = 'policy-item';
        card.innerHTML = `
            <div class="policy-header">
                <div class="policy-info">
                    <strong>${this.config.icon} ${this.config.title}</strong>
                    <small>${this.config.description}</small>
                </div>
                <div class="policy-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" 
                               id="allow${this.config.type.charAt(0).toUpperCase() + this.config.type.slice(1)}" 
                               ${this.config.enabled ? 'checked' : ''}
                               ${this.disabled ? 'disabled' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            <div class="pricing-controls" id="${this.config.type}Pricing">
                <div class="price-input-group">
                    <label for="${this.config.type}Price">Price per proof (USDC):</label>
                    <div class="price-input">
                        <span class="currency">$</span>
                        <input type="number" 
                               id="${this.config.type}Price" 
                               min="${this.config.minPrice}" 
                               max="${this.config.maxPrice}" 
                               step="0.001" 
                               value="${this.config.price}"
                               ${this.disabled ? 'disabled' : ''}>
                    </div>
                </div>
                <div class="price-description">
                    <small>💡 Typical range: ${this.config.typicalRange} per proof</small>
                    <small>🔗 Network: Polygon</small>
                </div>
            </div>
        `;

        return card;
    }

    private bindEvents(): void {
        const toggleInput = this.element.querySelector(`#allow${this.config.type.charAt(0).toUpperCase() + this.config.type.slice(1)}`) as HTMLInputElement;
        const priceInput = this.element.querySelector(`#${this.config.type}Price`) as HTMLInputElement;

        if (toggleInput) {
            toggleInput.addEventListener('change', () => {
                this.onToggle(this.config.type, toggleInput.checked);
                this.updatePricingVisibility(toggleInput.checked);
            });
        }

        if (priceInput) {
            priceInput.addEventListener('change', () => {
                const price = parseFloat(priceInput.value) || 0;
                this.onPriceChange(this.config.type, price);
            });

            priceInput.addEventListener('input', () => {
                // Real-time validation
                this.validatePrice(priceInput);
            });
        }

        // Initial pricing visibility
        this.updatePricingVisibility(this.config.enabled);
    }

    private updatePricingVisibility(enabled: boolean): void {
        const pricingControls = this.element.querySelector('.pricing-controls') as HTMLElement;
        if (pricingControls) {
            pricingControls.style.display = enabled ? 'block' : 'none';
        }
    }

    private validatePrice(input: HTMLInputElement): void {
        const value = parseFloat(input.value);
        
        if (value < this.config.minPrice) {
            input.setCustomValidity(`Price must be at least $${this.config.minPrice}`);
            input.style.borderColor = '#dc3545';
        } else if (value > this.config.maxPrice) {
            input.setCustomValidity(`Price must be at most $${this.config.maxPrice}`);
            input.style.borderColor = '#dc3545';
        } else {
            input.setCustomValidity('');
            input.style.borderColor = '#ddd';
        }
    }

    public updateConfig(newConfig: Partial<PredicateConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        const toggleInput = this.element.querySelector(`#allow${this.config.type.charAt(0).toUpperCase() + this.config.type.slice(1)}`) as HTMLInputElement;
        const priceInput = this.element.querySelector(`#${this.config.type}Price`) as HTMLInputElement;

        if (toggleInput && newConfig.enabled !== undefined) {
            toggleInput.checked = newConfig.enabled;
            this.updatePricingVisibility(newConfig.enabled);
        }

        if (priceInput && newConfig.price !== undefined) {
            priceInput.value = newConfig.price.toString();
        }
    }

    public getConfig(): PredicateConfig {
        return { ...this.config };
    }

    public destroy(): void {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Factory function for creating predicate cards
export function createPredicatePolicyCard(
    container: HTMLElement,
    config: PredicateConfig,
    onToggle: (type: string, enabled: boolean) => void,
    onPriceChange: (type: string, price: number) => void,
    disabled: boolean = false
): PredicatePolicyCard {
    return new PredicatePolicyCard(container, config, onToggle, onPriceChange, disabled);
}
