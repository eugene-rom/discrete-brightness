/* global imports */

import GObject from 'gi://GObject'
import St from 'gi://St'

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const NUM_MAX      = 15;
const TEXT_DBRGHNS = 'Discrete brightness';
const TEXT_LOGID   = 'discrete-brightness';

class DBrightnessBtn extends PanelMenu.Button
{
    static {
        GObject.registerClass(this);
    }

    constructor()
    {
        super( 0.0, TEXT_DBRGHNS );

        this._max_br   = NUM_MAX;
        this._prc_mult = 100 / this._max_br;

        this._radioGroup = [];
        let hbox = new St.BoxLayout( { style_class: 'panel-status-menu-box' } );
        hbox.add_child( new St.Icon( { icon_name: 'display-brightness-symbolic',
                                       style_class: 'system-status-icon' } ) );
        this.add_child(hbox);

        for ( var i = this._max_br; i >= 0; i-- )
        {
            let item = new PopupMenu.PopupMenuItem( i.toString() );
            this._radioGroup.push(item);
            item.radioGroup = this._radioGroup;
            item.setOrnament( PopupMenu.Ornament.NONE );
            item.connect('activate', () => {
                let group = item.radioGroup;
                for ( let i = 0; i < group.length; i++ ) {
                    group[i].setOrnament( (group[i] === item) ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE );
                }
                this._set_brightness( item.label.get_text() );
            });

            this.menu.addMenuItem( item );
        }

        this.menu.actor.connect( 'notify::visible', this._onVisibilityChanged.bind(this) );
    }

    _onVisibilityChanged() {
        if ( this.menu.actor.visible ) {
            let curBr = this._get_brightness();

            for ( var i = 0; i < this._radioGroup.length; i++ ) {
                let b = ( parseInt( this._radioGroup[i].label.get_text() ) === curBr );
                this._radioGroup[i].setOrnament( b ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE );
            }
        }
    };

    _get_brightness() {
        let curBrPercent = Main.panel.statusArea.quickSettings._backlight.quickSettingsItems[0]._proxy.Brightness;
        return Math.round( curBrPercent / this._prc_mult );
    };

    _set_brightness( num ) {
        Main.panel.statusArea.quickSettings._backlight.quickSettingsItems[0]._proxy.Brightness = Math.round( num * this._prc_mult );
    };
}

export default class DBrightness extends Extension
{
    enable() {
        this._theext = new DBrightnessBtn();
        Main.panel.addToStatusArea( TEXT_DBRGHNS, this._theext );
    }

    disable() {
        this._theext.destroy();
        this._theext = null;
    }
}
