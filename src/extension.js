/* global imports */

const { GLib, St } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const NUM_MAX      = 15;
const TEXT_DBRGHNS = 'Discrete brightness';
const TEXT_LOGID   = 'discrete-brightness';

let dbrightness;

class DBrightness extends PanelMenu.Button
{
    constructor()
    {
        super( 0.0, TEXT_DBRGHNS );

        this._max_br   = _get_max_brightness();
        this._prc_mult = 100 / this._max_br;

        this._radioGroup = [];
        let hbox = new St.BoxLayout( { style_class: 'panel-status-menu-box' } );
        hbox.add_child( new St.Icon( { icon_name: 'display-brightness-symbolic',
                                       style_class: 'system-status-icon' } ) );
        this.actor.add_child(hbox);

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

        this._onVisibilityChanged = () => {
            if ( this.menu.actor.visible ) {
                let curBr = this._get_brightness();

                for ( var i = 0; i < this._radioGroup.length; i++ ) {
                    let b = ( parseInt( this._radioGroup[i].label.get_text() ) === curBr );
                    this._radioGroup[i].setOrnament( b ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE );
                }
            }
        };

        this._get_brightness = () => {
            let curBrPercent = Main.panel.statusArea.aggregateMenu._brightness._proxy.Brightness;
            return Math.round( curBrPercent / this._prc_mult );
        };

        this._set_brightness = ( num ) => {
            Main.panel.statusArea.aggregateMenu._brightness._proxy.Brightness = Math.round( num * this._prc_mult );
        };

        this.menu.actor.connect( 'notify::visible', this._onVisibilityChanged.bind(this) );
    }
};

function _get_max_brightness()
{
    let maxBr;
    try {
        // does not work in 3.32
        let cmd = '/usr/lib/gnome-settings-daemon/gsd-backlight-helper --get-max-brightness';
        maxBr = parseInt( String( GLib.spawn_command_line_sync( cmd )[1] ) );
        if ( maxBr > NUM_MAX || isNaN( maxBr ) ) {
            maxBr = NUM_MAX;
        }
    }
    catch (err) {
        maxBr = NUM_MAX;
    }

    return maxBr;
}

function enable() {
    dbrightness = new DBrightness;
    Main.panel.addToStatusArea( TEXT_DBRGHNS, dbrightness );
}

function disable() {
    dbrightness.destroy();
}
