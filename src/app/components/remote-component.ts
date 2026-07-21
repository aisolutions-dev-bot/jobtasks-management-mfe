import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    ViewContainerRef,
    AfterViewInit,
    ComponentRef,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    effect,
    isSignal,
    ChangeDetectorRef,
    NgZone,
    inject,
} from '@angular/core';
import { loadRemoteModule, LoadRemoteModuleOptions } from '@angular-architects/module-federation';
import { environment } from '../../environments/environment';

@Component({
    selector: 'remote-component',
    template: `<ng-template #vc></ng-template>`,
    standalone: true,
})
export class RemoteComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() remoteEntry!: string;
    @Input() exposedModule!: string;
    @Input() exportName!: string;
    @Input() inputs: Record<string, any> = {};
    @Output() outputs = new EventEmitter<Record<string, any>>();

    @ViewChild('vc', { read: ViewContainerRef, static: true })
    private vc!: ViewContainerRef;

    private compRef?: ComponentRef<any>;
    private cd = inject(ChangeDetectorRef);
    private zone = inject(NgZone);

    constructor() {
        effect(() => {
            if (!this.compRef) return;
            Object.entries(this.inputs).forEach(([key, value]) => {
                if (isSignal(value)) {
                    this.compRef!.instance[key] = value();
                }
            });
            this.compRef.changeDetectorRef?.detectChanges();
            this.cd.detectChanges();
        });
    }

    async ngAfterViewInit(): Promise<void> {
        await this.loadComponent();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['inputs'] && this.compRef) {
            this.assignInputs();
        }
    }

    private async loadComponent(): Promise<void> {
        try {
            const options: LoadRemoteModuleOptions = {
                type: 'module',
                remoteEntry: environment.uiMfeUrl,
                exposedModule: this.exposedModule,
            };

            const module = await loadRemoteModule(options);
            const ComponentClass = module[this.exportName];
            if (!ComponentClass) throw new Error(`Export "${this.exportName}" not found`);

            this.zone.run(() => {
                this.vc.clear();
                this.compRef = this.vc.createComponent(ComponentClass);

                this.assignInputs();
                this.bindOutputs();
                this.compRef!.changeDetectorRef.detectChanges();
                this.cd.detectChanges();
            });
        } catch (err) {
            console.error('[RemoteComponent] Failed to load remote:', err);
        }
    }

    private assignInputs(): void {
        if (!this.compRef) return;
        Object.entries(this.inputs).forEach(([key, value]) => {
            if (!isSignal(value)) this.compRef!.instance[key] = value;
        });
        this.compRef.changeDetectorRef?.detectChanges();
        this.cd.detectChanges();
    }

    private bindOutputs(): void {
        if (!this.compRef?.instance) return;
        Object.keys(this.compRef.instance).forEach((key) => {
            const prop = this.compRef!.instance[key];
            if (prop instanceof EventEmitter) {
                prop.subscribe((val: any) => this.outputs.emit({ [key]: val }));
            }
        });
    }

    ngOnDestroy(): void {
        this.compRef?.destroy();
    }
}
