(function () {
    var form = document.getElementById('intake-form');
    var select = document.getElementById('intake-service');
    var subject = document.getElementById('intake-subject');
    var next = document.getElementById('intake-next');
    var status = document.getElementById('form-status');
    var button = document.getElementById('intake-submit');

    if (next) {
        next.value = new URL('/contact/thanks/', window.location.href).href;
    }

    function syncSubject() {
        if (!subject || !select) return;
        var chosen = select.options[select.selectedIndex];
        if (select.value && chosen) {
            subject.value = 'White Rabbit Security inquiry: ' + chosen.text;
        } else {
            subject.value = 'White Rabbit Security inquiry';
        }
    }

    if (select) {
        var requested = new URLSearchParams(window.location.search).get('service');
        if (requested) {
            var wanted = requested.toLowerCase();
            for (var i = 0; i < select.options.length; i++) {
                var option = select.options[i];
                if (option.value && (option.value === requested || option.value.toLowerCase() === wanted)) {
                    select.value = option.value;
                    break;
                }
            }
        }
        select.addEventListener('change', syncSubject);
        syncSubject();
    }

    if (!form || !window.fetch || !window.FormData) return;

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        syncSubject();
        if (status) status.textContent = '';

        var idleLabel = button ? button.textContent : '';
        if (button) {
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.textContent = 'Sending…';
        }

        var thanksUrl = new URL('/contact/thanks/', window.location.href).href;

        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
        }).then(function (response) {
            if (response.ok) {
                var type = (response.headers.get('content-type') || '').toLowerCase();
                if (type.indexOf('application/json') === -1) {
                    window.location.assign(thanksUrl);
                    return null;
                }
                return response.json().then(function (payload) {
                    if (payload && payload.ok === false) {
                        var rejected = new Error('The message could not be sent. Please try again in a moment.');
                        rejected.formspree = true;
                        throw rejected;
                    }
                    window.location.assign(thanksUrl);
                });
            }
            return response.json().catch(function () {
                return {};
            }).then(function (payload) {
                var message = 'The message could not be sent. Please try again in a moment.';
                if (payload && Array.isArray(payload.errors)) {
                    var parts = payload.errors.map(function (error) {
                        return error && error.message ? error.message : '';
                    }).filter(Boolean);
                    if (parts.length) message = parts.join(' ');
                }
                var err = new Error(message);
                err.formspree = true;
                throw err;
            });
        }).catch(function (error) {
            if (status) {
                status.textContent = error && error.formspree
                    ? error.message
                    : 'The message could not be sent. Check your connection and try again.';
            }
            if (button) {
                button.disabled = false;
                button.removeAttribute('aria-busy');
                button.textContent = idleLabel;
            }
        });
    });
})();
