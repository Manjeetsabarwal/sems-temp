import { injectable } from 'tsyringe';
import { IWhatsAppProvider } from './whatsapp-provider.interface';
import { MetaCloudProvider } from './meta-cloud-provider';

@injectable()
export class WhatsAppProviderFactory {
    private provider: IWhatsAppProvider;

    constructor() {
        const providerType = process.env.WHATSAPP_PROVIDER || 'meta';

        switch (providerType.toLowerCase()) {
            case 'meta':
                this.provider = new MetaCloudProvider();
                break;
            // Future providers can be added here
            // case 'twilio':
            //     this.provider = new TwilioProvider();
            //     break;
            // case 'gupshup':
            //     this.provider = new GupshupProvider();
            //     break;
            default:
                console.warn(`[WhatsAppProviderFactory] Unknown provider: ${providerType}, defaulting to Meta`);
                this.provider = new MetaCloudProvider();
        }

        console.log(`[WhatsAppProviderFactory] Initialized provider: ${providerType}`);
    }

    getProvider(): IWhatsAppProvider {
        return this.provider;
    }
}
