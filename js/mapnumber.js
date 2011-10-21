function mapnumber(map) {
    var n = document.createElement('input');
    n.type = 'text';
    n.className = 'map-number';

    map.addCallback('zoomed', function() {
        n.value = map.getZoom();
    });

    n.value = map.getZoom();

    map.parent.appendChild(n);
}
