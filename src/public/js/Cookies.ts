

export class Cookies {

    public static set(name: string, value: string, expires ?: Date|number, path ?: string, domain ?: string) {
        let cookie = name + "=" + encodeURIComponent(value) + ";";

        if (expires) {
            // If it's a date
            if (expires instanceof Date) {
                // If it isn't a valid date
                if (isNaN(expires.getTime()))
                    expires = new Date();
            }
            else
                expires = new Date(new Date().getTime() + expires * 1000 * 60 * 60 * 24);

            cookie += "expires=" + expires.toUTCString() + ";";
        }

        if (path)
            cookie += "path=" + path + ";";
        if (domain)
            cookie += "domain=" + domain + ";";

        document.cookie = cookie;
    }

    public static get(name: string): string|undefined {

        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }

        return null;
    }

    public static remove(name: string, path ?: string, domain ?: string) {
        if (Cookies.get(name)) {
            Cookies.set(name, "", -1, path, domain);
        }
    }
}