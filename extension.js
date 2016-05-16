
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const nc = imports.gi.NMClient
const wifi = imports.gi.NMClient.DeviceWifi;
const NetworkManager = imports.gi.NetworkManager
const Mainloop = imports.mainloop;

let ncc = nc.Client.new()
let targetWifiDev;
let detailText;
let signalId;
let timeoutId;
const interval = 1000;

function init() {
}

function getNetwork() {
    return Main.panel.statusArea["aggregateMenu"]._network;
}

function updateTimeout() {
    timeoutId = Mainloop.timeout_add(interval, Lang.bind(ncc, updateTimeout));
    updateText();
}

function updateText() {
    let statusText = '';
    if (targetWifiDev.state == NetworkManager.DeviceState.ACTIVATED) {
        let ap = targetWifiDev.get_active_access_point();
        detailText.set_text("%s/%s (%d%%)".format(targetWifiDev.get_iface(), ap.get_ssid(), ap.get_strength()));
    } else {
        detailText.set_text("");
    }
}

// https://www.roojs.org/seed/gir-1.2-gtk-3.0/seed/NMClient.AccessPoint.html#expand
// https://www.roojs.org/seed/gir-1.2-gtk-3.0/seed/NMClient.Client.html
// https://www.roojs.org/seed/gir-1.2-gtk-3.0/seed/NMClient.DeviceWifi.html
// https://extensions.gnome.org/review/4561
function enable() {
    // locate the first wifi device.
    let iface_list = ncc.get_devices()
    for(let j = 0; j < iface_list.length; j++){
        if(iface_list[j].get_device_type() == NetworkManager.DeviceType.WIFI) {
            targetWifiDev = iface_list[j];
            break;
        }
    }

    if (!targetWifiDev) {
        return;
    }

    let network = getNetwork();
    detailText = new St.Label({ text: "", y_align: Clutter.ActorAlign.CENTER });
    network.indicators.add_child(detailText);

    // so we can be notified of network changes.
    signalId = targetWifiDev.connect('notify::state',Lang.bind(ncc, updateText));
    timeoutId = Mainloop.timeout_add(interval, Lang.bind(ncc, updateTimeout));
    updateText.call(network);
}

function disable() {
    targetWifiDev.disconnect(signalId);
    Mainloop.source_remove(timeoutId);
    detailText.destroy();
}
