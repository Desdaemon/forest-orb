export function fetchNewest(path, important, req) {
	return new Promise((resolve, reject) => {
		let ret;
		if (!req) req = {};

		fetch(path, req)
			.then((response) => {
				ret = response;
				if (response.headers.has('Last-Modified')) {
					const lastModified = response.headers.get('Last-Modified');
					if (!req.headers) req.headers = {};
					req.headers['If-Modified-Since'] = lastModified;
					// if (important) dependencyFiles[path] = lastModified;
					fetch(path, req)
						.then((response) => {
							if (response.status === 200) ret = response;
							resolve(ret);
						})
						.catch((err) => reject(err));
				} else resolve(ret);
			})
			.catch((err) => reject(err));
	});
}
