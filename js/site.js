var mm = com.modestmaps, _data;

function projectWatcher(options) {
    var w = {}, _updated = '';

    w.watch = function() {
        reqwest({
            url: 'http://localhost:8889/api/Project/' +
                options.project + '/' + _updated + '?callback=grid',
            type: 'jsonp',
            jsonpCallback: 'callback',
            success: function(data) {
                if (data._updated) {
                    _updated = data._updated;
                    options.refresh(data);
                }
            }
        });
    };

    window.setInterval(w.watch, 1000);

    return w;
}

function toDOM(str) {
    var d = document.createElement('div');
    d.innerHTML = str;
    return d.firstChild;
}

function column() {
    var c = {}, div;
    var maps = [];
    var maptmpl = _.template($('#map').text());
    var columntmpl = _.template($('#column').text());

    c.init = function() {
        div = toDOM(columntmpl());
        $('.add-map', div).click(function() {
            c.add();
        });
        return this;
    };

    c.add = function() {
        var mapdiv = toDOM(maptmpl());
        var map = new mm.Map(mapdiv, undefined, null, [
            new mm.DragHandler(),
            new mm.DoubleClickHandler()
        ]);
        mapnumber(map);
        maps.push(map);
        wax.mm.zoomer(map).appendTo(map.parent);
        if (_data) c.update(_data);
        if (maps.length > 1) map.setCenter(maps[0].getCenter());
        return this;
    };

    c.appendTo = function(x) {
        x.appendChild(div);
        return this;
    };

    function sync(map) {
        maps.map(function(m) {
            if (m !== map) m.setCenter(map.getCenter());
        });
    }

    c.update = function(data) {
        _data = data;
        maps.map(function(m) {
            if (m.parent.parentNode !== div) {
                div.appendChild(m.parent);
                m.addCallback('panned', _.throttle(sync, 500));
            }
            m.setProvider(new wax.mm.connector(data));
        });
        return this;
    };

    return c.init();
}

$(window).load(function() {
    var columntmpl = _.template($('#column').text());
    var maptmpl = _.template($('#map').text());
    var columns = [];


    columns.push(column().add().appendTo($('#container')[0]));

    $('#add-column').click(function() {
        columns.push(column().add().appendTo($('#container')[0]));
        document.body.style.width = (columns.length * 600) + 'px';
    });

    $('#start').click(function() {
        projectWatcher({
            project: $('#project-name')[0].value,
            refresh: function(data) {
                _data = data;
                data.tiles = data.tiles.map(function(t) {
                    return 'http://localhost:8889' + t;
                });
                columns.map(function(c) {
                    c.update(data);
                });
            }
        });
    });
});
