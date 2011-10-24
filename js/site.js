var mm = com.modestmaps, _data, opts = {}, columns = [];

function projectWatcher(opts, callbacks) {
    var w = {}, _updated = '';

    w.watch = function() {
        optsHash();
        reqwest({
            url: opts.host + '/api/Project/' +
                opts.project + '/' + _updated + '?callback=grid',
            type: 'jsonp',
            jsonpCallback: 'callback',
            success: function(data) {
                if (data._updated) {
                    data.tiles = data.tiles.map(function(t) {
                        return opts.host + t;
                    });
                    _updated = data._updated;
                    callbacks.refresh(data);
                }
            }
        });
    };

    w.set = function(x) {
        opts = x;
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
        $('.add-map', div).click(function(e) {
            c.add();
            e.preventDefault();
        });
        return this;
    };

    c.add = function(coord) {
        var mapdiv = toDOM(maptmpl());
        var map = new mm.Map(mapdiv, undefined, null, [
            new mm.DragHandler(),
            new mm.DoubleClickHandler()
        ]);
        mapnumber(map);
        maps.push(map);
        wax.mm.zoomer(map).appendTo(map.parent);
        if (_data) c.update(_data);
        if (coord) {
            map.coordinate = new mm.Coordinate(
                coord.row,
                coord.column,
                coord.zoom);
        } else {
            if (maps.length > 1) map.setCenter(maps[0].getCenter());
        }
        return this;
    };

    c.appendTo = function(x) {
        x.appendChild(div);
        return this;
    };

    c.coords = function(xs) {
        if (xs) {
            return xs.map(function(x) {
                c.add(x);
            });
        }

        if (maps.length === 0 || !maps[0].provider) return [];
        return maps.map(function(m) {
            return {
                column: m.coordinate.column,
                row: m.coordinate.row,
                zoom: m.coordinate.zoom
            };
        });
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

function hashOpts(str) {
    return JSON.parse(str.substring(1));
}

function optsHash() {
    updateOpts();
    window.location.hash = JSON.stringify(opts);
}

function updateOpts() {
    opts.columns =  columns.map(function(c) {
        return c.coords();
    });
}

$(window).load(function() {
    var columntmpl = _.template($('#column').text()),
        maptmpl = _.template($('#map').text()),
        optiontmpl = _.template($('#option').text());

    try {
        opts = hashOpts(window.location.hash);
        opts.columns.map(function(c) {
            var x = column();
            x.coords(c);
            columns.push(x);
        });
    } catch(e) {
        var h = window.prompt('TileMill server hostname, no trailing slash.', 'http://localhost:8889');
        opts = {
            'host': h
        };
        optsHash();
    }

    reqwest({
        url: opts.host + '/api/Project/?callback=grid',
        type: 'jsonp',
        jsonpCallback: 'callback',
        success: function(data) {
            data.map(function(p) {
                $('#project-name').append(optiontmpl(p));
            });
        }
    });

    columns.push(column().add().appendTo($('#container')[0]));

    $('#add-column').click(function(e) {
        columns.push(column().add().appendTo($('#container')[0]));
        document.body.style.width = (columns.length * 500) + 'px';
        optsHash();
        e.preventDefault();
    });

    var pw = projectWatcher(opts, {
        refresh: function(data) {
            _data = data;
            columns.map(function(c) {
                c.update(data);
            });
        }
    });

    $('#project-name').change(function() {
        opts.project = $('#project-name').val();
        pw.set(opts);
        optsHash();
    });
});
